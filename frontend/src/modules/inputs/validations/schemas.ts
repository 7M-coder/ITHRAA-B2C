import { z } from 'zod'
import type { Rule } from 'antd/es/form'
import { isSafeInput } from '@/modules/core/utils/inputSafety'

const text = z.string().trim().max(200).refine(isSafeInput)
const empty = (value: unknown) => (value === '' || value === null ? undefined : value)
const optionalText = z.preprocess(empty, text.optional())
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  )
const amount = z.number().finite().nonnegative().max(1_000_000_000)
const optionalAmount = z.preprocess(empty, amount.optional())
const count = z.preprocess(empty, z.number().int().nonnegative().max(100_000).optional())
const optionalDate = z.preprocess(empty, isoDate.optional())
export const flightSegmentSchema = z.object({
  id: z.string().trim().min(1).max(200).refine(isSafeInput),
  flightNumber: optionalText,
  travelDate: optionalDate,
  departureDateH: optionalText,
  from: optionalText,
  to: optionalText,
  departureTime: z.preprocess(
    empty,
    z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional()
  ),
  arrivalTime: z.preprocess(
    empty,
    z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional()
  ),
  arrivalDayOffset: z.preprocess(empty, z.number().int().nonnegative().max(30).optional()),
  capacity: count
})
export const flightRequestSchema = z
  .object({
    id: z.string().trim().min(1).max(200).refine(isSafeInput),
    recordNumber: optionalText,
    airline: optionalText,
    pnr: optionalText,
    country: optionalText,
    notes: z.preprocess(empty, z.string().trim().max(4000).refine(isSafeInput).optional()),
    arrivalDate: optionalDate,
    arrivalRoute: optionalText,
    departureDate: optionalDate,
    departureRoute: optionalText,
    currency: z.preprocess(
      empty,
      z
        .string()
        .trim()
        .regex(/^[A-Za-z]{3}$/)
        .transform((v) => v.toUpperCase())
        .optional()
    ),
    fare: optionalAmount,
    otherTaxes: optionalAmount,
    farePerPassenger: optionalAmount,
    passengersRequested: count,
    totalFare: optionalAmount,
    seats: count,
    issuedNames: optionalText,
    bookingFare: optionalAmount,
    exchangeRate: optionalAmount,
    sarEquivalent: optionalAmount,
    totalSeatValue: optionalAmount,
    paymentPercentage: z.preprocess(empty, z.number().finite().min(0).max(100).optional()),
    firstPayment: optionalAmount,
    segments: z.array(flightSegmentSchema)
  })
  .superRefine((record, ctx) => {
    if (!record.pnr && !record.segments.some((segment) => segment.flightNumber))
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pnr'], message: 'identity' })
  })
export const flightRequestsSchema = z.array(flightRequestSchema)

/** Validates field values using the shared schema. @param schema - Field schema. @param errorMessage - Translated message. @returns Ant Design rules. */
export function inputRules(schema: z.ZodTypeAny, errorMessage: string): Rule[] {
  return [
    {
      validator: async (_rule, value: unknown) => {
        if (!schema.safeParse(value).success) throw new Error(errorMessage)
      }
    }
  ]
}
export const flightInputSchemas = { text, isoDate, amount }
