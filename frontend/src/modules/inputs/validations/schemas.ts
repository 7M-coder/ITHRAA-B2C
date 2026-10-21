import { z } from 'zod'
import type { Rule } from 'antd/es/form'
import { isSafeInput } from '@/modules/core/utils/inputSafety'

const text = z.string().trim().min(1).max(200).refine(isSafeInput)
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  )
const amount = z.number().finite().nonnegative().max(1_000_000_000)

export const flightRequestSchema = z.object({
  id: text,
  pnr: text,
  arrivalDate: isoDate,
  arrivalRoute: text,
  departureDate: isoDate,
  departureRoute: text,
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/),
  fare: amount,
  otherTaxes: amount,
  farePerPassenger: amount,
  passengersRequested: z.number().int().positive().max(100_000),
  totalFare: amount
})

export const flightRequestsSchema = z.array(flightRequestSchema)

/** Creates translated form rules from the shared schema. @param schema - Field validator. @param errorMessage - Localized message. @returns Ant Design rules. */
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
