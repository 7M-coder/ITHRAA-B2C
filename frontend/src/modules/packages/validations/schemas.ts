import { z } from 'zod'
import {
  packageSchema as legacyPackageSchema,
  packageServicesSchema,
  providerSchema,
  blockSchema as legacyBlockSchema,
  packageTextSchema,
  requiredPackageTextSchema,
  currencyCodeSchema
} from './legacySchemas'
import { stayPeriods, MAX_STAY_PERIODS } from '../utils/periods'
import { isSeasonDate } from '../utils/dates'
import { validTransport } from '../utils/transport'
import { readiness } from '../utils/finance'
import { descriptionDocumentSchema, descriptionTextSchema } from '../utils/description'
import {
  OPTIONAL_SERVICE_PRICE_IDS,
  REQUIRED_SERVICE_PRICE_IDS,
  SERVICE_PRICE_IDS
} from '../utils/servicePricing'
export {
  createPackageFieldRule,
  packageLongTextSchema,
  packageTextSchema,
  requiredPackageTextSchema,
  currencyCodeSchema,
  packageLinesSchema,
  providerSchema
} from './legacySchemas'
export const blockSchema = legacyBlockSchema.extend({ pilgrimType: z.literal('international') })
const text = packageTextSchema
const date = z
  .string()
  .refine(
    (v) =>
      v === '' ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    'invalidDate'
  )
const amount = z.number().finite().min(0).max(1e10).nullable()
const stay = z
  .object({
    id: z.string().min(1),
    city: text,
    hotel: text,
    roomTypes: z
      .array(z.union([z.literal(2), z.literal(3), z.literal(4)]))
      .max(3)
      .refine((values) => new Set(values).size === values.length, 'duplicateIds')
      .optional(),
    kind: z.enum(['primary', 'transitional']),
    checkIn: date,
    checkOut: date,
    contractRef: text,
    notes: text,
    periods: z
      .array(z.object({ id: z.string().min(1), checkIn: date, checkOut: date }))
      .min(1)
      .max(30)
      .optional()
  })
  .superRefine((s, ctx) => {
    const periods = stayPeriods(s)
    if (new Set(periods.map((p) => p.id)).size !== periods.length)
      ctx.addIssue({ code: 'custom', path: ['periods'], message: 'duplicateIds' })
    periods.forEach((p, i) => {
      if (p.checkIn && p.checkOut && p.checkOut <= p.checkIn)
        ctx.addIssue({ code: 'custom', path: ['periods', i, 'checkOut'], message: 'dateRange' })
      if (i > 0 && p.checkIn && periods[i - 1].checkOut && p.checkIn < periods[i - 1].checkOut)
        ctx.addIssue({ code: 'custom', path: ['periods', i], message: 'periodOverlap' })
    })
    if (s.checkIn && s.checkOut && s.checkOut <= s.checkIn)
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'dateRange' })
  })
const servicePrice = z.object({
  id: z.enum(
    SERVICE_PRICE_IDS as [(typeof SERVICE_PRICE_IDS)[number], ...typeof SERVICE_PRICE_IDS]
  ),
  amount,
  enabled: z.boolean()
})
export const editorObjectSchema = z.object({
  previousPricing: z.record(z.unknown()).optional(),
  category: z.enum([
    '',
    'economy',
    'standard',
    'premium',
    'luxury',
    'transitional',
    'luxury_transitional',
    'premium_transitional',
    'basic',
    'basic_transitional'
  ]),
  capacity: z.number().int().positive().nullable(),
  stays: z.array(stay),
  servicePrices: z.array(servicePrice).length(SERVICE_PRICE_IDS.length),
  services: z.array(
    z.object({
      id: z.string().min(1),
      category: z.enum(['transportation', 'mashair', 'meals', 'guidance', 'visa', 'additional']),
      transportType: z.enum(['intercity', 'mashair']).optional(),
      transportMode: z.enum(['bus', 'haramain_train', 'private_car', 'mashair_train']).optional(),
      providerId: z.string().min(1).optional(),
      description: text,
      included: z.boolean()
    })
  ),
  needsReview: z.boolean()
})
export const editorSchema = editorObjectSchema.superRefine((editor, ctx) => {
  const ids = editor.servicePrices.map((service) => service.id)
  if (
    new Set(ids).size !== SERVICE_PRICE_IDS.length ||
    SERVICE_PRICE_IDS.some((id) => !ids.includes(id))
  )
    ctx.addIssue({ code: 'custom', path: ['servicePrices'], message: 'invalidServicePrices' })
  for (const service of editor.servicePrices) {
    if (REQUIRED_SERVICE_PRICE_IDS.includes(service.id) && !service.enabled)
      ctx.addIssue({ code: 'custom', path: ['servicePrices'], message: 'requiredServiceDisabled' })
    if (
      OPTIONAL_SERVICE_PRICE_IDS.includes(service.id) &&
      !service.enabled &&
      service.amount !== null
    )
      ctx.addIssue({ code: 'custom', path: ['servicePrices'], message: 'disabledServicePriced' })
  }
})
export const packageRecordSchema = legacyPackageSchema
  .innerType()
  .omit({ price: true })
  .extend({
    pilgrimType: z.literal('international'),
    description: descriptionTextSchema,
    descriptionDocument: descriptionDocumentSchema.optional(),
    providerId: z.string(),
    startDate: date,
    endDate: date,
    editor: editorSchema,
    services: packageServicesSchema,
    currency: currencyCodeSchema,
    name: requiredPackageTextSchema
  })
  .superRefine((p, ctx) => {
    if (p.startDate && p.endDate && p.endDate < p.startDate)
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'dateRange' })
    const e = p.editor
    for (const [key, list] of Object.entries({ stays: e.stays, services: e.services }))
      if (new Set(list.map((v) => v.id)).size !== list.length)
        ctx.addIssue({ code: 'custom', path: ['editor', key], message: 'duplicateIds' })
    e.services.forEach((s, i) => {
      if (
        s.category === 'transportation' &&
        s.transportType &&
        s.transportMode &&
        !validTransport(s.transportType, s.transportMode)
      )
        ctx.addIssue({
          code: 'custom',
          path: ['editor', 'services', i],
          message: 'invalidTransport'
        })
    })
    e.stays.forEach((s, i) => {
      if (
        stayPeriods(s).some(
          (period) =>
            (period.checkIn && p.startDate && period.checkIn < p.startDate) ||
            (period.checkOut && p.endDate && period.checkOut > p.endDate)
        )
      )
        ctx.addIssue({ code: 'custom', path: ['editor', 'stays', i], message: 'stayOutside' })
    })
    if (p.status === 'available' && readiness(p).length)
      ctx.addIssue({ code: 'custom', path: ['status'], message: 'notReady' })
  })
/** Validates writes against the current season while permitting retained historical records to hydrate. */
export const packageSchema = packageRecordSchema.superRefine((p, ctx) => {
  p.editor.stays.forEach((s, i) => {
    if (stayPeriods(s).length > MAX_STAY_PERIODS)
      ctx.addIssue({
        code: 'custom',
        path: ['editor', 'stays', i, 'periods'],
        message: 'periodLimit'
      })
  })
  for (const key of ['startDate', 'endDate'] as const)
    if (!isSeasonDate(p[key])) ctx.addIssue({ code: 'custom', path: [key], message: 'seasonRange' })
  p.editor.stays.forEach((s, i) =>
    stayPeriods(s).forEach((period, j) => {
      if (!isSeasonDate(period.checkIn) || !isSeasonDate(period.checkOut))
        ctx.addIssue({
          code: 'custom',
          path: ['editor', 'stays', i, 'periods', j],
          message: 'seasonRange'
        })
    })
  )
})
export const packageDemoSchema = z
  .object({
    packages: z.array(packageRecordSchema),
    providers: z.array(providerSchema),
    blocks: z.array(blockSchema)
  })
  .superRefine((data, ctx) => {
    for (const records of [data.packages, data.providers, data.blocks])
      if (new Set(records.map((r) => r.id)).size !== records.length)
        ctx.addIssue({ code: 'custom', message: 'duplicateIds' })
    for (const p of data.packages)
      if (p.providerId && !data.providers.some((v) => v.id === p.providerId))
        ctx.addIssue({ code: 'custom', message: 'missingProvider' })
    for (const p of data.packages)
      for (const service of p.editor.services)
        if (service.providerId && !data.providers.some((v) => v.id === service.providerId))
          ctx.addIssue({ code: 'custom', message: 'missingProvider' })
    for (const b of data.blocks) {
      if (!b.packageId) continue
      const p = data.packages.find((p) => p.id === b.packageId)
      if (!p || p.season !== b.season || p.pilgrimType !== b.pilgrimType)
        ctx.addIssue({ code: 'custom', message: 'invalidBlockPackage' })
    }
  })
