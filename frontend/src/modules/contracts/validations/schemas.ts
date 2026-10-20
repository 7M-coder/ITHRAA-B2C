import { z } from 'zod'
import { isSafeInput } from '@/modules/core/utils/inputSafety'

const englishText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, 'required')
    .max(max, 'invalid')
    .refine(isSafeInput, 'unsafe')
    .refine((value) => /^[\x20-\x7E]+$/.test(value), 'englishOnly')

const organizerContractObjectSchema = z.object({
  organizerSource: z.enum(['direct', 'indirect']),
  pilgrimCount: z.number().int().min(1).max(100000),
  organizerName: englishText(2, 150),
  passportNumber: z
    .string()
    .trim()
    .min(5, 'invalid')
    .max(30, 'invalid')
    .refine(isSafeInput, 'unsafe')
    .refine((value) => /^[A-Za-z0-9]+$/.test(value), 'englishOnly'),
  nationality: englishText(2, 80),
  mobileNumber: z
    .string()
    .trim()
    .min(7, 'invalid')
    .max(20, 'invalid')
    .refine(isSafeInput, 'unsafe')
    .refine((value) => /^\+?[0-9 ()-]+$/.test(value), 'invalid'),
  country: englishText(2, 100),
  city: englishText(2, 100),
  languages: englishText(2, 200),
  hajjExperience: englishText(2, 1000)
})

export const organizerContractFieldSchemas = organizerContractObjectSchema.shape
export const organizerContractSchema = organizerContractObjectSchema

/** Returns the keys required by the organizer contract form. @returns Contract field keys. */
export function getOrganizerContractFieldKeys(): (keyof z.infer<typeof organizerContractSchema>)[] {
  return Object.keys(organizerContractObjectSchema.shape) as (keyof z.infer<
    typeof organizerContractSchema
  >)[]
}
