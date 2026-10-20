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
import { stayPeriods } from '../utils/periods'
import { isSeasonDate } from '../utils/dates'
import { validTransport } from '../utils/transport'
import { readiness } from '../utils/finance'
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
const tax = z.enum(['included', 'excluded', 'unknown'])
const room = z.object({
  occupancy: z.number().int().min(1).max(4),
  enabled: z.boolean(),
  beds: z.number().int().min(0).nullable(),
  amount,
  basis: z.enum(['room_night', 'bed_stay', 'bed_night']),
  legacyAmount: amount.optional(),
  legacyBasis: z.enum(['room_night', 'bed_stay']).optional(),
  tax
})
const stay = z
  .object({
    id: z.string().min(1),
    city: text,
    hotel: text,
    kind: z.enum(['primary', 'transitional']),
    checkIn: date,
    checkOut: date,
    contractRef: text,
    notes: text,
    periods: z
      .array(z.object({ id: z.string().min(1), checkIn: date, checkOut: date }))
      .min(1)
      .max(30)
      .optional(),
    rooms: z.array(room)
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
    if (new Set(s.rooms.map((r) => r.occupancy)).size !== s.rooms.length)
      ctx.addIssue({ code: 'custom', message: 'duplicateIds' })
  })
const option = z.object({
  needsReview: z.boolean().optional(),
  id: z.string().min(1),
  name: text,
  selections: z.record(z.number().int().min(1).max(4)),
  approvedAmount: amount,
  tax,
  notes: text
})
export const editorSchema = z.object({
  bedTaxes: z
    .object({
      vat: z.number().finite().min(0).max(100),
      accommodation: z.number().finite().min(0).max(100),
      collection: z.number().finite().min(0).max(100),
      city: z.number().finite().min(0).max(100)
    })
    .optional(),
  category: z.enum(['', 'economy', 'standard', 'premium', 'luxury']),
  capacity: z.number().int().positive().nullable(),
  stays: z.array(stay),
  options: z.array(option),
  services: z.array(
    z.object({
      id: z.string().min(1),
      category: z.enum(['transportation', 'mashair', 'meals', 'guidance', 'visa', 'additional']),
      transportType: z.enum(['intercity', 'mashair']).optional(),
      transportMode: z.enum(['bus', 'haramain_train', 'private_car', 'mashair_train']).optional(),
      description: text,
      included: z.boolean()
    })
  ),
  mode: z.enum(['approved_price', 'cost_draft']),
  costs: z.array(
    z.object({
      id: z.string().min(1),
      name: text,
      amount,
      basis: z.enum(['person', 'group']),
      divisor: z.number().int().positive().nullable(),
      optionId: z.string().nullable(),
      tax
    })
  ),
  approval: z.object({ by: text, date, reference: text }),
  legacyPrice: z.number().finite().min(0).optional(),
  needsReview: z.boolean()
})
export const packageRecordSchema = legacyPackageSchema
  .innerType()
  .extend({
    pilgrimType: z.literal('international'),
    providerId: z.string(),
    startDate: date,
    endDate: date,
    editor: editorSchema,
    services: packageServicesSchema,
    price: z.number().finite().min(0),
    currency: currencyCodeSchema,
    name: requiredPackageTextSchema
  })
  .superRefine((p, ctx) => {
    if (p.startDate && p.endDate && p.endDate < p.startDate)
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'dateRange' })
    const e = p.editor
    for (const [key, list] of Object.entries({
      stays: e.stays,
      options: e.options,
      costs: e.costs,
      services: e.services
    }))
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
    e.options.forEach((o, i) => {
      for (const [id, occupancy] of Object.entries(o.selections)) {
        if (
          !e.stays.some(
            (s) => s.id === id && s.rooms.some((r) => r.enabled && r.occupancy === occupancy)
          )
        )
          ctx.addIssue({
            code: 'custom',
            path: ['editor', 'options', i],
            message: 'invalidSelection'
          })
      }
    })
    e.costs.forEach((c, i) => {
      if (c.optionId && !e.options.some((o) => o.id === c.optionId))
        ctx.addIssue({ code: 'custom', path: ['editor', 'costs', i], message: 'invalidSelection' })
    })
    if (p.status === 'available' && readiness(p).length)
      ctx.addIssue({ code: 'custom', path: ['status'], message: 'notReady' })
  })
/** Validates writes against the current season while permitting retained historical records to hydrate. */
export const packageSchema = packageRecordSchema.superRefine((p, ctx) => {
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
    for (const b of data.blocks) {
      if (!b.packageId) continue
      const p = data.packages.find((p) => p.id === b.packageId)
      if (!p || p.season !== b.season || p.pilgrimType !== b.pilgrimType)
        ctx.addIssue({ code: 'custom', message: 'invalidBlockPackage' })
    }
  })
