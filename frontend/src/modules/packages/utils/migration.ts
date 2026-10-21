import type { HajjPackage, PackageDemoData } from '../types/domain'
import type { PackageEditorData } from '../types/editor'
import { packageDemoSchema as legacySchema } from '../validations/legacySchemas'
import { z } from 'zod'
import {
  packageDemoSchema,
  packageRecordSchema,
  blockSchema,
  editorObjectSchema
} from '../validations/schemas'
import { emptyEditor, newStay, readiness } from './finance'
import { createDefaultServicePrices } from './servicePricing'
import { SERVICE_PRICE_IDS } from './servicePricing'
import { roomTypesFromLegacy } from './roomTypes'

const oldAmount = z.number().finite().min(0).max(1e10).nullable()
const oldOptionSchema = z.object({
  needsReview: z.boolean().optional(),
  id: z.string().min(1),
  name: z.string(),
  selections: z.record(z.number().int().min(1).max(4)),
  approvedAmount: oldAmount,
  tax: z.enum(['included', 'excluded', 'unknown']),
  notes: z.string()
})
const oldRoomSchema = z.object({
  occupancy: z.number().int().min(1).max(4),
  enabled: z.boolean(),
  beds: z.number().int().min(0).nullable(),
  amount: oldAmount,
  basis: z.enum(['room_night', 'bed_stay', 'bed_night']),
  legacyAmount: oldAmount.optional(),
  legacyBasis: z.enum(['room_night', 'bed_stay']).optional(),
  tax: z.enum(['included', 'excluded', 'unknown'])
})
const oldStaySchema = z.object({
  id: z.string().min(1),
  city: z.string(),
  hotel: z.string(),
  kind: z.enum(['primary', 'transitional']),
  checkIn: z.string(),
  checkOut: z.string(),
  contractRef: z.string(),
  notes: z.string(),
  periods: z
    .array(z.object({ id: z.string(), checkIn: z.string(), checkOut: z.string() }))
    .optional(),
  rooms: z.array(oldRoomSchema)
})
const oldEditorSchema = editorObjectSchema.omit({ servicePrices: true }).extend({
  bedTaxes: z
    .object({
      vat: z.number(),
      accommodation: z.number(),
      collection: z.number(),
      city: z.number()
    })
    .optional(),
  stays: z.array(oldStaySchema),
  options: z.array(oldOptionSchema),
  mode: z.enum(['approved_price', 'cost_draft']),
  costs: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: oldAmount,
      basis: z.enum(['person', 'group']),
      divisor: z.number().int().positive().nullable(),
      optionId: z.string().nullable(),
      tax: z.enum(['included', 'excluded', 'unknown'])
    })
  ),
  approval: z.object({ by: z.string(), date: z.string(), reference: z.string() }),
  legacyPrice: z.number().finite().min(0).optional()
})
const v5ServicePriceSchema = z.object({
  id: z.enum(
    SERVICE_PRICE_IDS as [(typeof SERVICE_PRICE_IDS)[number], ...typeof SERVICE_PRICE_IDS]
  ),
  amount: oldAmount,
  enabled: z.boolean()
})
const v5OptionSchema = z.object({
  needsReview: z.boolean().optional(),
  id: z.string().min(1),
  name: z.string(),
  selections: z.record(z.number().int().min(1).max(4)),
  notes: z.string()
})
const v5EditorSchema = editorObjectSchema.omit({ servicePrices: true, stays: true }).extend({
  bedTaxes: z
    .object({
      vat: z.number(),
      accommodation: z.number(),
      collection: z.number(),
      city: z.number()
    })
    .optional(),
  stays: z.array(oldStaySchema),
  options: z.array(v5OptionSchema),
  servicePrices: z.array(v5ServicePriceSchema)
})
const oldRecordSchema = packageRecordSchema.innerType().extend({
  editor: oldEditorSchema,
  price: z.number().finite().min(0)
})
const oldDemoSchema = packageDemoSchema.innerType().extend({ packages: z.array(oldRecordSchema) })
const v5RecordSchema = packageRecordSchema.innerType().extend({ editor: v5EditorSchema })
const v5DemoSchema = packageDemoSchema.innerType().extend({ packages: z.array(v5RecordSchema) })

/** Converts a v1 record while archiving its approved package price and preserving its program. @param item - Legacy package. @returns Migrated package. */
export function upgradePackage(
  item: Omit<HajjPackage, 'pilgrimType'> & {
    pilgrimType: 'domestic' | 'international'
    price?: number
  }
): HajjPackage {
  const current = omitFields(item, ['price'])
  if (item.editor) return stripRemovedPricing(item as HajjPackage & { editor: unknown })
  const editor = emptyEditor()
  editor.needsReview = true
  editor.previousPricing = { price: item.price, accommodation: item.services.accommodation }
  editor.stays = (item.services.accommodation ?? []).map((s, i) => ({
    ...newStay(),
    id: `${item.id}-stay-${i}`,
    city: s.city,
    hotel: s.name,
    checkIn: s.checkIn,
    checkOut: s.checkOut,
    roomTypes: roomTypesFromLegacy([
      { enabled: true, occupancy: (s as unknown as Record<string, unknown>).peoplePerRoom }
    ]),
    notes: s.amenities
  }))
  return {
    ...current,
    pilgrimType: 'international',
    status: item.status === 'available' ? 'draft' : item.status,
    editor
  }
}

/** Validates and migrates saved package data, archiving former room pricing and initializing service prices. @param value - Persisted state. @param version - Original storage version. @returns Validated current state. */
export function migratePackageState(value: unknown, version: number): PackageDemoData {
  if (version === 1) {
    const old = legacySchema.parse(value)
    return packageDemoSchema.parse({
      ...old,
      packages: old.packages.map(upgradePackage).map(reviewCurrentRules),
      blocks: old.blocks.map((b) => ({ ...b, pilgrimType: 'international' }))
    })
  }
  if (version === 2) {
    const oldVersionTwo = packageDemoSchema
      .innerType()
      .extend({
        packages: z.array(
          oldRecordSchema.extend({ pilgrimType: z.enum(['domestic', 'international']) })
        ),
        blocks: z.array(blockSchema.extend({ pilgrimType: z.enum(['domestic', 'international']) }))
      })
      .parse(value)
    return packageDemoSchema.parse({
      ...oldVersionTwo,
      packages: oldVersionTwo.packages.map((p) =>
        reviewCurrentRules(
          stripRemovedPricing({ ...p, pilgrimType: 'international' } as unknown as HajjPackage & {
            editor: unknown
          })
        )
      ),
      blocks: oldVersionTwo.blocks.map((b) => ({ ...b, pilgrimType: 'international' }))
    })
  }
  if (version === 3 || version === 4) {
    const old = oldDemoSchema.parse(value)
    return packageDemoSchema.parse({
      ...old,
      packages: old.packages.map((p) =>
        reviewCurrentRules(stripRemovedPricing(p as unknown as HajjPackage & { editor: unknown }))
      )
    })
  }
  if (version === 5) {
    const old = v5DemoSchema.parse(value)
    return packageDemoSchema.parse({
      ...old,
      packages: old.packages.map((item) =>
        reviewCurrentRules(
          stripRemovedPricing(item as unknown as HajjPackage & { editor: unknown })
        )
      )
    })
  }
  if (version === 6 || version === 7) {
    const parsed = packageDemoSchema.parse(value)
    return packageDemoSchema.parse({
      ...parsed,
      packages: parsed.packages.map(restoreArchivedRoomTypes)
    })
  }
  if (version === 8) return packageDemoSchema.parse(value)
  throw new Error('unsupportedVersion')
}

/** Archives deprecated room and approved-price data while preserving hotel stays and service pricing. @param item - Validated previous package. @returns Package without room options. */
function stripRemovedPricing(item: HajjPackage & { editor: unknown; price?: number }): HajjPackage {
  const packageData = omitFields(item, ['price'])
  const editor = packageData.editor as PackageEditorData & Record<string, unknown>
  const stays = editor.stays.map((stay) => ({
    ...omitFields(stay as typeof stay & Record<string, unknown>, ['rooms']),
    roomTypes:
      stay.roomTypes ?? roomTypesFromLegacy((stay as unknown as Record<string, unknown>).rooms)
  }))
  const servicePrices = Array.isArray(editor.servicePrices)
    ? editor.servicePrices
    : createDefaultServicePrices()
  const editorData = omitFields(editor, [
    'bedTaxes',
    'mode',
    'costs',
    'approval',
    'legacyPrice',
    'options',
    'servicePrices'
  ])
  return {
    ...packageData,
    editor: {
      ...editorData,
      stays,
      previousPricing: editor.previousPricing ?? {
        price: item.price,
        rooms: editor.stays.map((stay) => ({
          id: stay.id,
          rooms: (stay as unknown as Record<string, unknown>).rooms
        })),
        ...Object.fromEntries(
          ['bedTaxes', 'mode', 'costs', 'approval', 'legacyPrice', 'options']
            .filter((key) => key in editor)
            .map((key) => [key, editor[key]])
        )
      },
      servicePrices
    } as unknown as PackageEditorData
  }
}

/** Removes fields made obsolete by a storage migration. @param value - Source record. @param keys - Fields to omit. @returns Record without obsolete fields. */
function omitFields<T extends object, K extends string>(value: T, keys: readonly K[]): Omit<T, K> {
  const result = { ...value } as Record<string, unknown>
  keys.forEach((key) => delete result[key])
  return result as Omit<T, K>
}

/** Downgrades newly incomplete legacy offers without changing their program or links. @param item - Stored package. @returns Package requiring review when necessary. */
function reviewCurrentRules(item: HajjPackage): HajjPackage {
  return item.status === 'available' && readiness(item).length
    ? { ...item, status: 'draft', editor: { ...item.editor!, needsReview: true } }
    : item
}

/** Restores archived room selections for existing service-pricing records, retaining explicit user choices. @param item - Validated package. @returns Package with recovered housing choices. */
function restoreArchivedRoomTypes(item: HajjPackage): HajjPackage {
  if (!item.editor) return item
  const archived = item.editor.previousPricing?.rooms
  if (!Array.isArray(archived)) return item
  return {
    ...item,
    editor: {
      ...item.editor,
      stays: item.editor.stays.map((stay) => {
        if (stay.roomTypes !== undefined) return stay
        const source = archived.find(
          (entry) => entry && typeof entry === 'object' && entry.id === stay.id
        )
        const types = roomTypesFromLegacy(source?.rooms)
        return types.length ? { ...stay, roomTypes: types } : stay
      })
    }
  }
}
