import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { Rule } from 'antd/es/form'
import { isSafeInput } from '../utils/inputSafety'
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v)
const amount = z.number().finite().min(0).max(1e10)
export const employeeSchema = z
  .object({
    id: z.string(),
    fullName: z
      .string()
      .trim()
      .min(2, 'nameError')
      .max(100, 'nameError')
      .refine(isSafeInput, 'unsafe'),
    nationality: z.enum(['Saudi', 'NonSaudi']),
    nationalId: z
      .string()
      .regex(/^[12]\d{9}$/, 'idError')
      .refine(isSafeInput, 'unsafe'),
    bankIban: z
      .string()
      .trim()
      .regex(/^SA\d{22}$/i, 'ibanError')
      .refine(isSafeInput, 'unsafe')
      .transform((v) => v.toUpperCase()),
    idExpiryDate: date,
    jobTitle: z.string().trim().min(2, 'jobError').refine(isSafeInput, 'unsafe'),
    basicSalary: amount,
    housingAllowance: amount,
    transportAllowance: amount,
    gosiRate: z.number().finite().min(0).max(100),
    employmentStatus: z.enum(['Active', 'Terminated']).default('Active'),
    uncompensatedLeaveDays: z.number().finite().min(0).default(0)
  })
  .superRefine((value, ctx) => {
    if (!value.nationalId.startsWith(value.nationality === 'Saudi' ? '1' : '2'))
      ctx.addIssue({ code: 'custom', path: ['nationalId'], message: 'idNationalityError' })
  })
export const assetSchema = z.object({
  id: z.string(),
  employeeId: z.string().min(1),
  type: z.enum(['Car', 'Laptop', 'Advance']),
  description: z.string().trim().min(1, 'required').refine(isSafeInput, 'unsafe'),
  serialNumber: z.string().trim().refine(isSafeInput, 'unsafe'),
  assignedAt: date,
  status: z.enum(['Active', 'Returned', 'Lost'])
})
/** Adapts a Zod field to Ant Design rules. @param schema - Field schema. @param t - Translator. @returns Form rule. */
export function fieldRule(schema: z.ZodTypeAny, t: TFunction): Rule {
  return {
    validator: async (_, value) => {
      if (value === undefined || value === null) throw new Error(t('required'))
      const result = schema.safeParse(value)
      if (!result.success) {
        const key = result.error.issues[0].message
        throw new Error(
          t(
            [
              'required',
              'nameError',
              'idError',
              'ibanError',
              'jobError',
              'unsafe',
              'idNationalityError'
            ].includes(key)
              ? key
              : 'invalid'
          )
        )
      }
    }
  }
}
