import { z } from 'zod'
import type { FormInstance } from 'antd'
import type { Rule } from 'antd/es/form'
import { isSafeInput } from '@/modules/core/utils/inputSafety'
import { roomTotal, pricedRoomTypes, roomTypes } from '../utils/rooms'
import { isAdjacentPeriodStart } from '../utils/periods'
import { nightlyBedPricing, toHalalas } from '../utils/pricing'
const text = z.string().trim().min(1).max(200).refine(isSafeInput, 'unsafe')
export const housingMoneySchema = z
  .number()
  .finite()
  .nonnegative()
  .multipleOf(0.01)
  .refine((v) => toHalalas(v) !== null)
export const unifiedNumberSchema = text.refine((value) => /^[\p{L}\p{Nd}]{10}$/u.test(value))
const count = z.number().finite().int().nonnegative()
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v)
export const accommodationFields = z.object({
  id: text,
  city: z.enum(['makkah', 'madinah']),
  name: text,
  classification: z.enum(['unclassified', '1', '2', '3', '4', '5', 'licensed']),
  capacity: count.positive(),
  rooms: z.object({ double: count, triple: count, quadruple: count, suites: count }),
  unifiedNumber: text,
  pricingBasis: z
    .enum(['room_contract', 'bed_night', 'bed_rate_total', 'bed_night_three'])
    .optional(),
  suiteBeds: z.number().int().positive().refine(Number.isSafeInteger).optional(),
  roomRates: z
    .object({
      double: housingMoneySchema.optional(),
      triple: housingMoneySchema.optional(),
      quadruple: housingMoneySchema.optional(),
      suites: housingMoneySchema.optional()
    })
    .optional(),
  contractPrice: housingMoneySchema.optional(),
  contractStart: date,
  contractEnd: date,
  periods: z.array(z.object({ start: date, end: date })).min(1),
  catering: z.boolean(),
  board: z.enum(['half', 'full']).optional()
})
export const accommodationSchema = accommodationFields
  .superRefine((v, ctx) => {
    if (roomTotal(v.rooms) > v.capacity)
      ctx.addIssue({ code: 'custom', path: ['rooms'], message: 'capacity' })
    if (v.contractEnd <= v.contractStart)
      ctx.addIssue({ code: 'custom', path: ['contractEnd'], message: 'range' })
    if (v.catering && !v.board)
      ctx.addIssue({ code: 'custom', path: ['board'], message: 'required' })
    v.periods.forEach((p, i) => {
      if (
        p.end <= p.start ||
        p.start < v.contractStart ||
        p.end > v.contractEnd ||
        (i === 0
          ? p.start !== v.contractStart
          : !isAdjacentPeriodStart(p.start, v.periods[i - 1].end)) ||
        (i === v.periods.length - 1 && p.end !== v.contractEnd)
      )
        ctx.addIssue({ code: 'custom', path: ['periods', i, 'start'], message: 'coverage' })
    })
  })
  .transform((v) => ({ ...v, board: v.catering ? v.board : undefined }))
export const accommodationsSchema = z
  .array(accommodationSchema)
  .refine((v) => new Set(v.map((x) => x.id)).size === v.length)
/** Connects field schemas to Ant Design. @param schema - Field schema. @param message - Translated error. @returns Form rules. */
export function accommodationRules(schema: z.ZodTypeAny, message: string): Rule[] {
  return [
    {
      validator: async (_rule, value: unknown) => {
        if (!schema.safeParse(value).success) throw new Error(message)
      }
    }
  ]
}

// Hydration permits older records without inventing a historical price.
export const accommodationWriteSchema = accommodationSchema.superRefine((record, ctx) => {
  if (!unifiedNumberSchema.safeParse(record.unifiedNumber).success)
    ctx.addIssue({ code: 'custom', path: ['unifiedNumber'], message: 'reference' })
  for (const key of record.pricingBasis === 'bed_night' ? roomTypes : pricedRoomTypes)
    if (record.rooms[key] > 0 && record.roomRates?.[key] === undefined)
      ctx.addIssue({ code: 'custom', path: ['roomRates', key], message: 'rateRequired' })
  if (record.pricingBasis !== 'bed_night_three' && record.pricingBasis !== 'bed_night')
    ctx.addIssue({ code: 'custom', path: ['roomRates'], message: 'legacyRates' })
  if (
    record.pricingBasis === 'bed_night' &&
    record.rooms.suites > 0 &&
    record.suiteBeds === undefined
  )
    ctx.addIssue({ code: 'custom', path: ['suiteBeds'], message: 'suiteBedsRequired' })
  for (const key of pricedRoomTypes)
    if (record.roomRates?.[key] !== undefined && nightlyBedPricing(record.roomRates[key]) === null)
      ctx.addIssue({ code: 'custom', path: ['roomRates', key], message: 'pricingIncomplete' })
  if (record.contractPrice === undefined)
    ctx.addIssue({ code: 'custom', path: ['contractPrice'], message: 'priceRequired' })
})
/** Checks related dates, including typed input. @param getValue - Form field reader. @param field - Date role. @param messages - Localized errors. @param index - Period index. @returns Form rules. */
export function accommodationDateRules(
  getValue: FormInstance['getFieldValue'],
  field: 'contractStart' | 'contractEnd' | 'start' | 'end',
  messages: { invalid: string; range: string; coverage: string; order: string },
  index = 0
): Rule[] {
  return [
    {
      validator: async (_rule, value: unknown) => {
        if (!date.safeParse(value).success) throw new Error(messages.invalid)
        const v = value as string
        const start = getValue('contractStart') as string | undefined
        const end = getValue('contractEnd') as string | undefined
        if (field === 'contractStart' || field === 'contractEnd') {
          if (
            (field === 'contractStart' && end && v >= end) ||
            (field === 'contractEnd' && start && v <= start)
          )
            throw new Error(messages.range)
          return
        }
        const ownStart = getValue(['periods', index, 'start']) as string | undefined
        const ownEnd = getValue(['periods', index, 'end']) as string | undefined
        if (
          (field === 'end' && ownStart && v <= ownStart) ||
          (field === 'start' && ownEnd && v >= ownEnd)
        )
          throw new Error(messages.range)
        if ((start && v < start) || (end && v > end)) throw new Error(messages.coverage)
        if (field === 'start') {
          const previous =
            index > 0 ? (getValue(['periods', index - 1, 'end']) as string | undefined) : start
          if (previous && v < previous) throw new Error(messages.order)
          if (previous && (index === 0 ? v !== previous : !isAdjacentPeriodStart(v, previous)))
            throw new Error(messages.coverage)
        } else {
          const periods = getValue('periods') as unknown[] | undefined
          if (periods && index === periods.length - 1 && end && v !== end)
            throw new Error(messages.coverage)
        }
      }
    }
  ]
}
