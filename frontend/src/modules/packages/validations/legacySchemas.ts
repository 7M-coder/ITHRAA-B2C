import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { Rule } from 'antd/es/form'
import { isSafeInput } from '@/modules/core/utils/inputSafety'

/** Builds a safe optional text schema. @param max - Maximum accepted length. @returns Zod text schema. */
const safeText = (max = 500) => z.string().trim().max(max).refine(isSafeInput, 'unsafe')
/** Builds a safe required text schema. @param max - Maximum accepted length. @returns Zod text schema. */
const requiredText = (max = 120) =>
  z.string().trim().min(1, 'required').max(max).refine(isSafeInput, 'unsafe')
export const packageTextSchema = safeText()
export const packageLongTextSchema = safeText(2000)
export const requiredPackageTextSchema = requiredText()
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/)
export const packageLinesSchema = z
  .string()
  .refine((value) => value.split(/\r?\n/).every(isSafeInput), 'unsafe')
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  )
const maybeDate = z.string().refine((value) => value === '' || date.safeParse(value).success)
const maybeNumber = z.number().finite().min(0).nullable()

export const accommodationSchema = z.object({
  name: requiredText(),
  city: requiredText(80),
  location: safeText(200),
  classification: safeText(80),
  nights: maybeNumber,
  checkIn: maybeDate,
  checkOut: maybeDate,
  amenities: safeText()
})
export const flightSchema = z.object({
  airline: requiredText(),
  origin: requiredText(120),
  destination: requiredText(120),
  departureAt: safeText(40),
  arrivalAt: safeText(40),
  flightNumber: safeText(40),
  travelClass: safeText(80),
  baggageAllowance: safeText(120)
})
export const transportSchema = z.object({
  vehicleType: requiredText(80),
  origin: requiredText(120),
  destination: requiredText(120),
  route: safeText(300),
  schedule: safeText(160),
  serviceClass: safeText(80)
})
export const mashairSchema = z.object({
  mina: safeText(),
  arafah: safeText(),
  muzdalifah: safeText(),
  campLevel: safeText(100),
  facilities: safeText(),
  transport: safeText()
})
export const mealsSchema = z.object({
  dailyMeals: maybeNumber,
  mealTypes: safeText(),
  locations: safeText(),
  includedDays: safeText(),
  dietaryOptions: safeText()
})
export const guidanceSchema = z.object({
  religiousGuidance: safeText(),
  organizationalGuidance: safeText(),
  languages: safeText(),
  supportChannels: safeText(),
  fieldSupport: safeText(),
  healthServices: safeText()
})
export const visaSchema = z.object({
  included: z.boolean(),
  visaType: safeText(100),
  requirements: safeText(),
  responsibleParty: safeText(120)
})
export const additionalServiceSchema = z.object({
  name: requiredText(),
  description: safeText(),
  included: z.boolean(),
  extraFee: safeText(120)
})

export const packageServicesSchema = z.object({
  accommodation: z.array(accommodationSchema).min(1).optional(),
  flights: z.array(flightSchema).min(1).optional(),
  transportation: z.array(transportSchema).min(1).optional(),
  mashair: mashairSchema.optional(),
  meals: mealsSchema.optional(),
  guidance: guidanceSchema.optional(),
  visa: visaSchema.optional(),
  additional: z.array(additionalServiceSchema).min(1).optional()
})

export const packageSchema = z
  .object({
    id: z.string().min(1),
    name: requiredText(),
    description: safeText(2000),
    pilgrimType: z.enum(['domestic', 'international']),
    season: requiredText(50),
    providerId: z.string().min(1),
    startDate: date,
    endDate: date,
    price: z.number().finite().min(0).max(1e10),
    currency: currencyCodeSchema,
    bookingPolicy: safeText(2000),
    cancellationPolicy: safeText(2000),
    bookingChannel: safeText(200),
    includedServices: z.array(requiredText(160)).max(50),
    excludedServices: z.array(requiredText(160)).max(50),
    services: packageServicesSchema,
    status: z.enum(['draft', 'available', 'paused', 'archived'])
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate)
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'dateRange' })
  })

export const providerSchema = z.object({
  id: z.string().min(1),
  name: requiredText(),
  categories: z
    .array(
      z.enum([
        'accommodation',
        'airline',
        'transport',
        'mashair',
        'catering',
        'guidance',
        'visa',
        'other'
      ])
    )
    .min(1),
  active: z.boolean()
})

export const blockSchema = z.object({
  id: z.string().min(1),
  code: requiredText(40),
  name: requiredText(),
  season: requiredText(50),
  pilgrimType: z.enum(['domestic', 'international']),
  packageId: z.string().nullable()
})

export const packageDemoSchema = z
  .object({
    packages: z.array(packageSchema),
    providers: z.array(providerSchema),
    blocks: z.array(blockSchema)
  })

  .superRefine((data, ctx) => {
    const packageIds = new Set(data.packages.map((item) => item.id))
    const providerIds = new Set(data.providers.map((item) => item.id))
    const blockIds = new Set(data.blocks.map((item) => item.id))
    if (
      packageIds.size !== data.packages.length ||
      providerIds.size !== data.providers.length ||
      blockIds.size !== data.blocks.length
    )
      ctx.addIssue({ code: 'custom', message: 'duplicateIds' })
    for (const item of data.packages) {
      if (!providerIds.has(item.providerId))
        ctx.addIssue({ code: 'custom', message: 'missingProvider' })
    }
    for (const block of data.blocks) {
      if (!block.packageId) continue
      const item = data.packages.find((candidate) => candidate.id === block.packageId)
      if (!item || item.season !== block.season || item.pilgrimType !== block.pilgrimType)
        ctx.addIssue({ code: 'custom', message: 'invalidBlockPackage' })
    }
  })

/** Adapts a Zod package field schema to translated Ant Design rules. @param schema - Field schema. @param t - Translator. @returns Ant Design validation rule. */
export function createPackageFieldRule(schema: z.ZodTypeAny, t: TFunction): Rule {
  return {
    validator: async (_, value) => {
      if (value === undefined || value === null) {
        if (schema.safeParse(value).success) return
        throw new Error(t('messages.required'))
      }
      const parsed = schema.safeParse(value)
      if (!parsed.success) {
        const issue = parsed.error.issues[0]?.message
        throw new Error(
          t(
            issue === 'unsafe'
              ? 'errors.unsafe'
              : issue === 'required'
                ? 'messages.required'
                : 'errors.invalid'
          )
        )
      }
    }
  }
}
