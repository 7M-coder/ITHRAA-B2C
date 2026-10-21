import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { Rule } from 'antd/es/form'
import { NATIONALITY_CODES } from '../../employees/types/nationality'
import { isSafeInput } from '../utils/inputSafety'
import { workflowSchema } from '../../custody/validations/schemas'
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v)
export const optionalPhone = z
  .string()
  .trim()
  .refine((v) => !v || /^(05\d{8}|\+9665\d{8})$/.test(v), 'phoneError')
  .refine(isSafeInput, 'unsafe')
  .transform((v) => (v.startsWith('05') ? `+966${v.slice(1)}` : v))
  .optional()
export const optionalEmail = z
  .string()
  .trim()
  .refine((v) => !v || z.string().email().safeParse(v).success, 'emailError')
  .refine(isSafeInput, 'unsafe')
  .optional()
export const optionalDepartment = z
  .string()
  .trim()
  .max(100)
  .refine(isSafeInput, 'unsafe')
  .optional()
export const optionalStartDate = z.union([date, z.literal('')]).optional()
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
    nationalityCode: z.enum(NATIONALITY_CODES).optional(),
    otherNationality: z.string().trim().max(100).refine(isSafeInput, 'unsafe').optional(),
    phone: optionalPhone,
    email: optionalEmail,
    department: optionalDepartment,
    startDate: optionalStartDate,
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
    if (value.nationalityCode === 'OTHER' && !value.otherNationality?.trim())
      ctx.addIssue({ code: 'custom', path: ['otherNationality'], message: 'required' })
    const classification = value.nationalityCode
      ? value.nationalityCode === 'SA'
        ? 'Saudi'
        : 'NonSaudi'
      : value.nationality
    if (!value.nationalId.startsWith(classification === 'Saudi' ? '1' : '2'))
      ctx.addIssue({ code: 'custom', path: ['nationalId'], message: 'idNationalityError' })
  })
export const employeeCreateSchema = employeeSchema.superRefine((value, ctx) => {
  for (const key of ['department', 'startDate', 'nationalityCode'] as const)
    if (!value[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required' })
})
export const assetSchema = z.object({
  workflow: workflowSchema.optional(),
  id: z.string(),
  employeeId: z.string().min(1),
  type: z.enum(['Car', 'Laptop', 'Advance', 'Equipment']),
  description: z.string().trim().min(1, 'required').refine(isSafeInput, 'unsafe'),
  serialNumber: z.string().trim().refine(isSafeInput, 'unsafe'),
  assignedAt: date,
  status: z.enum(['Active', 'Returned', 'Lost'])
})
/** Adapts a Zod field to Ant Design rules. @param schema - Field schema. @param t - Translator. @returns Form rule. */
export function fieldRule(schema: z.ZodTypeAny, t: TFunction): Rule {
  return {
    validator: async (_, value) => {
      const result = schema.safeParse(value)
      if (!result.success) {
        const key =
          value === undefined || value === null ? 'required' : result.error.issues[0].message
        throw new Error(
          t(
            [
              'required',
              'phoneError',
              'emailError',
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
