import { describe, expect, it } from 'vitest'
import { nightlyBedSellingPricing } from '../utils/pricing'
import { accommodationDateRules, accommodationWriteSchema } from '../validations/schemas'
import { migrateAccommodationState } from '../utils/migration'
import { currentRecord } from './fixtures'
describe('nightly bed profit and partial periods', () => {
  it('adds flat profit after independent taxes without taxing the profit', () => {
    expect(nightlyBedSellingPricing(100, 10)).toEqual({
      base: 10000,
      taxes: { vat: 1500, city: 300, accommodation: 500, collection: 200 },
      profit: 1000,
      total: 13500
    })
    expect(nightlyBedSellingPricing(100, 0)?.total).toBe(12500)
    expect(nightlyBedSellingPricing(0, 0)?.total).toBe(0)
    expect(nightlyBedSellingPricing(100, -1)).toBeNull()
    expect(
      accommodationWriteSchema.safeParse({
        ...currentRecord,
        contractPrice: undefined,
        roomProfits: { double: -1 }
      }).success
    ).toBe(false)
    expect(
      accommodationWriteSchema.safeParse({
        ...currentRecord,
        contractPrice: undefined,
        roomProfits: { double: 10, triple: 20, quadruple: 30 }
      }).success
    ).toBe(true)
  })
  it('does not blame a valid first period while the next period is incomplete', async () => {
    const values = {
      contractStart: '2026-10-24',
      contractEnd: '2026-11-04',
      periods: [
        { start: '2026-10-24', end: '2026-10-27' },
        { start: '2026-10-27', end: undefined }
      ]
    }
    const getValue = (path: unknown) =>
      (Array.isArray(path) ? path : [path]).reduce((value, key) => value?.[key], values)
    const rule = accommodationDateRules(
      getValue,
      'end',
      { invalid: 'invalid', range: 'range', coverage: 'coverage', order: 'order' },
      0
    )[0] as { validator: (_: unknown, value: unknown) => Promise<void> }
    await expect(rule.validator({}, '2026-10-27')).resolves.toBeUndefined()
    await expect(rule.validator({}, '2026-10-28')).rejects.toThrow('order')
    expect(accommodationWriteSchema.safeParse({ ...currentRecord, ...values }).success).toBe(false)
    values.periods[1].end = '2026-11-04' as never
    expect(accommodationWriteSchema.safeParse({ ...currentRecord, ...values }).success).toBe(true)
    values.periods.pop()
    await expect(rule.validator({}, '2026-10-27')).resolves.toBeUndefined()
    expect(accommodationWriteSchema.safeParse({ ...currentRecord, ...values }).success).toBe(false)
  })
  it('migrates with zero margins and preserves historical contract totals', () => {
    const migrated = migrateAccommodationState({ records: [currentRecord], demoSeeded: true }, 1)
    expect(migrated.records[0]).toMatchObject({
      id: currentRecord.id,
      roomRates: currentRecord.roomRates,
      roomProfits: { double: 0, triple: 0, quadruple: 0 },
      historical: { contractPrice: currentRecord.contractPrice }
    })
    expect(migrated.records[0].contractPrice).toBeUndefined()
    expect(() => migrateAccommodationState({ records: [{ id: 'bad' }] }, 1)).toThrow()
  })
})
