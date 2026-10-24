import { z } from 'zod'
import type { Rule } from 'antd/es/form'
import { isSafeInput } from '@/modules/core/utils/inputSafety'
const text = z.string().trim().max(200).refine(isSafeInput)
/** Treats cleared optional controls as absent rather than zero. @param value - Form value. @returns Normalized value. */
const empty = (value: unknown) => (value === '' || value === null ? undefined : value)
const optionalText = z.preprocess(empty, text.optional())
const id = z.string().trim().min(1).max(200).refine(isSafeInput)
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  )
const optionalDate = z.preprocess(empty, isoDate.optional())
const time = z.preprocess(
  empty,
  z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
)
const money = z.number().finite().nonnegative().max(1_000_000_000).multipleOf(0.01)
export const flightSegmentSchema = z.object({
  id,
  city: optionalText,
  airport: optionalText,
  departureDate: optionalDate,
  departureTime: time,
  carrier: optionalText,
  flightNumber: optionalText,
  destination: optionalText,
  arrivalDate: optionalDate,
  arrivalTime: time
})
export const flightFields = z.object({
  id,
  pnr: optionalText,
  country: optionalText,
  notes: z.preprocess(empty, z.string().trim().max(4000).refine(isSafeInput).optional()),
  seats: z.preprocess(empty, z.number().int().nonnegative().max(100_000).optional()),
  currency: z.preprocess(empty, z.enum(['SAR', 'EUR', 'USD']).optional()),
  ticketPrice: z.preprocess(empty, money.optional()),
  profit: z.preprocess(empty, money.optional()),
  euroRate: z.preprocess(
    empty,
    z.number().finite().positive().max(1_000_000).multipleOf(0.000001).optional()
  ),
  inbound: z.array(flightSegmentSchema),
  outbound: z.array(flightSegmentSchema),
  historical: z.record(z.unknown()).optional()
})
export const flightRequestSchema = flightFields.superRefine((record, ctx) => {
  if (
    !record.pnr &&
    ![...record.inbound, ...record.outbound].some((leg) => leg.flightNumber) &&
    !record.historical
  )
    ctx.addIssue({ code: 'custom', path: ['pnr'], message: 'identity' })
  for (const direction of ['inbound', 'outbound'] as const)
    record[direction].forEach((leg, index) => {
      if (leg.departureDate && leg.arrivalDate && leg.arrivalDate < leg.departureDate)
        ctx.addIssue({
          code: 'custom',
          path: [direction, index, 'arrivalDate'],
          message: 'dateOrder'
        })
    })
})
export const flightWriteSchema = flightRequestSchema.superRefine((record, ctx) => {
  if (!record.pnr && ![...record.inbound, ...record.outbound].some((leg) => leg.flightNumber))
    ctx.addIssue({ code: 'custom', path: ['pnr'], message: 'identity' })
})
export const flightRequestsSchema = z
  .array(flightRequestSchema)
  .refine((records) => new Set(records.map((record) => record.id)).size === records.length)
/** Builds form rules from a shared field schema. @param schema - Zod field schema. @param message - Translated validation message. @returns Ant Design rules. */
export function inputRules(schema: z.ZodTypeAny, message: string): Rule[] {
  return [
    {
      validator: async (_rule, value: unknown) => {
        if (!schema.safeParse(value).success) throw new Error(message)
      }
    }
  ]
}
