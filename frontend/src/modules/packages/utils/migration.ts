import type { HajjPackage, PackageDemoData } from '../types/domain'
import { packageDemoSchema as legacySchema } from '../validations/legacySchemas'
import { z } from 'zod'
import { packageDemoSchema, packageRecordSchema, blockSchema } from '../validations/schemas'
import { emptyEditor, newStay, readiness } from './finance'
/** Converts a v1 record into a reviewable draft, preserving the original services and price. @param item - Original package. @returns Migrated package. */
export function upgradePackage(
  item: Omit<HajjPackage, 'pilgrimType'> & { pilgrimType: 'domestic' | 'international' }
): HajjPackage {
  if (item.editor) return { ...item, pilgrimType: 'international' }
  const editor = emptyEditor()
  editor.needsReview = true
  editor.legacyPrice = item.price
  editor.stays = (item.services.accommodation ?? []).map((s, i) => ({
    ...newStay(),
    id: `${item.id}-stay-${i}`,
    city: s.city,
    hotel: s.name,
    checkIn: s.checkIn,
    checkOut: s.checkOut,
    notes: s.amenities,
    rooms: newStay().rooms.map((r) => ({
      ...r,
      enabled:
        s.peoplePerRoom !== null && [1, 2, 3, 4].includes(s.peoplePerRoom)
          ? r.occupancy === s.peoplePerRoom
          : r.enabled
    }))
  }))
  return {
    ...item,
    pilgrimType: 'international',
    status: item.status === 'available' ? 'draft' : item.status,
    editor
  }
}
/** Validates the original shape before migrating persisted data. @param value - Persisted state. @param version - Original storage version. @returns Validated current state. */
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
    const previous = packageDemoSchema
      .innerType()
      .extend({
        packages: z.array(
          packageRecordSchema
            .innerType()
            .extend({ pilgrimType: z.enum(['domestic', 'international']) })
        ),
        blocks: z.array(blockSchema.extend({ pilgrimType: z.enum(['domestic', 'international']) }))
      })
      .parse(value)
    return packageDemoSchema.parse({
      ...previous,
      packages: previous.packages.map((p) =>
        reviewCurrentRules({ ...p, pilgrimType: 'international' })
      ),
      blocks: previous.blocks.map((b) => ({ ...b, pilgrimType: 'international' }))
    })
  }
  if (version === 3) {
    const previous = packageDemoSchema
      .innerType()
      .extend({ packages: z.array(packageRecordSchema.innerType()) })
      .parse(value)
    return packageDemoSchema.parse({
      ...previous,
      packages: previous.packages.map(reviewCurrentRules)
    })
  }
  if (version === 4) return packageDemoSchema.parse(value)
  throw new Error('unsupportedVersion')
}

/** Downgrades newly incomplete legacy offers without changing their program or links. @param item - Stored package. @returns Package requiring review when necessary. */
function reviewCurrentRules(item: HajjPackage): HajjPackage {
  return item.status === 'available' && readiness(item).length
    ? { ...item, status: 'draft', editor: { ...item.editor!, needsReview: true } }
    : item
}
