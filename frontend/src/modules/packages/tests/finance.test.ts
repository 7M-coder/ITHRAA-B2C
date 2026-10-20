import { describe, expect, it } from 'vitest'
import { completePackage } from './fixtures'
import {
  editorData,
  financialSummary,
  packageWarnings,
  readiness,
  removeStay,
  servicePricing
} from '../utils/finance'
import { packageSchema } from '../validations/schemas'
import { canAssignPackage } from '../utils/domain'
import { newPackage } from '../utils/editor'
import {
  OPTIONAL_SERVICE_PRICE_IDS,
  REQUIRED_SERVICE_PRICE_IDS,
  servicePriceWithVat
} from '../utils/servicePricing'

describe('package service pricing', () => {
  it('supports a minimal draft with only name and season', () => {
    expect(
      packageSchema.safeParse({ ...newPackage(), name: 'Draft', season: '1448' }).success
    ).toBe(true)
  })
  it('adds service VAT once to per-pilgrim prices and calculates the subtotal', () => {
    const p = completePackage()
    const result = servicePricing(p)
    expect(result.total).toBe(1150)
    expect(result.lines).toHaveLength(10)
    expect(result.lines[0].amount).toEqual({ base: 100, vat: 15, total: 115 })
    expect(servicePriceWithVat(115)?.total).toBe(132.25)
  })
  it('requires ten basic services and leaves all three special services optional', () => {
    const p = completePackage(),
      editor = editorData(p)
    expect(REQUIRED_SERVICE_PRICE_IDS).toHaveLength(10)
    expect(OPTIONAL_SERVICE_PRICE_IDS).toHaveLength(3)
    expect(readiness(p)).toEqual([])
    const meals = editor.servicePrices.find((service) => service.id === 'meals')!
    meals.amount = null
    expect(readiness(p)).toContain('servicePrices')
    expect(servicePricing(p).total).toBeNull()
    expect(packageSchema.safeParse({ ...p, status: 'draft' }).success).toBe(true)
    expect(packageSchema.safeParse({ ...p, status: 'available' }).success).toBe(false)
    meals.amount = 100
    const wheelchair = editor.servicePrices.find((service) => service.id === 'wheelchairCompanion')!
    wheelchair.enabled = true
    wheelchair.amount = 50
    expect(servicePricing(p).total).toBe(1207.5)
  })
  it('does not enable assignment until all required and selected special service prices are complete', () => {
    const p = completePackage()
    editorData(p).servicePrices.find((service) => service.id === 'simCard')!.amount = null
    p.status = 'draft'
    expect(packageSchema.safeParse(p).success).toBe(true)
    expect(canAssignPackage(p)).toBe(false)
    expect(financialSummary(p, (key) => key)).toBe('editor.incomplete')
  })
  it('accepts an explicit zero price and rejects invalid values', () => {
    const p = completePackage(),
      prices = editorData(p).servicePrices
    prices[0].amount = 0
    expect(servicePricing(p).total).toBe(1035)
    for (const amount of [-1, NaN, Infinity]) {
      prices[0].amount = amount
      expect(packageSchema.safeParse(p).success).toBe(false)
      expect(servicePricing(p).total).toBeNull()
    }
  })
  it('removes a hotel stay without room options or occupancy links', () => {
    const p = completePackage()
    const changed = removeStay(p, 'stay-a')
    expect(editorData(changed).stays.map((stay) => stay.id)).toEqual(['stay-b'])
    expect(editorData(changed)).not.toHaveProperty('options')
  })
  it('validates hotel date ranges and reports overlapping stays', () => {
    const p = completePackage(),
      editor = editorData(p)
    editor.stays[0].checkOut = '2027-05-10'
    expect(packageSchema.safeParse(p).success).toBe(false)
    editor.stays[0].checkOut = '2027-05-14'
    expect(packageSchema.safeParse(p).success).toBe(true)
    expect(packageWarnings(p)).toContain('overlap')
  })
})

it('rejects domestic packages and defaults new drafts to international pilgrims', () => {
  expect(newPackage().pilgrimType).toBe('international')
  expect(packageSchema.safeParse({ ...completePackage(), pilgrimType: 'domestic' }).success).toBe(
    false
  )
})

it('starts new packages with ten required and three optional service prices', () => {
  const p = newPackage()
  expect(editorData(p).servicePrices).toHaveLength(13)
  expect(packageSchema.safeParse({ ...p, name: 'Calculated draft' }).success).toBe(true)
})
