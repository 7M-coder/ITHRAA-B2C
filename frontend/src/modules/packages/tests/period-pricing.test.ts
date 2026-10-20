import { describe, expect, it } from 'vitest'
import { editorData, newStay, readiness, stayNights, stayPeriodNights } from '../utils/finance'
import { stayPeriods, resizePeriods, withPeriods } from '../utils/periods'
import { packageSchema } from '../validations/schemas'
import { migratePackageState } from '../utils/migration'
import { seedPackageData } from '../utils/seed'
import { completePackage } from './fixtures'
import { servicePricing } from '../utils/finance'

describe('hotel stay periods without room pricing', () => {
  it('counts nights across sequential periods and preserves period IDs when resizing', () => {
    const original = { ...newStay(), id: 'stay-a', checkIn: '2027-05-01', checkOut: '2027-05-04' }
    const resized = resizePeriods(original, 3)
    expect(stayPeriods(resized)[0].id).toBe('stay-a-period-1')
    expect(new Set(stayPeriods(resized).map((period) => period.id)).size).toBe(3)
    const stay = withPeriods(
      resized,
      stayPeriods(resized).map((period, index) => ({
        ...period,
        checkIn: ['2027-05-01', '2027-05-10', '2027-05-20'][index],
        checkOut: ['2027-05-04', '2027-05-12', '2027-05-24'][index]
      }))
    )
    expect(stayPeriodNights(stay)).toBe(9)
    expect(stay.checkIn).toBe('2027-05-01')
    expect(stay.checkOut).toBe('2027-05-24')
    expect(stayPeriods(resizePeriods(stay, 2))[0].id).toBe(stayPeriods(stay)[0].id)
  })
  it('rejects missing, overlapping, and invalid periods', () => {
    const stay = resizePeriods({ ...newStay(), checkIn: '2027-05-01', checkOut: '2027-05-04' }, 2)
    expect(stayPeriodNights(stay)).toBeNull()
    const overlap = withPeriods(
      stay,
      stayPeriods(stay).map((period, index) => ({
        ...period,
        checkIn: index ? '2027-05-03' : '2027-05-01',
        checkOut: index ? '2027-05-05' : '2027-05-04'
      }))
    )
    expect(stayPeriodNights(overlap)).toBeNull()
    expect(stayNights('2027-02-30', '2027-03-04')).toBeNull()
    const p = completePackage()
    editorData(p).stays = [{ ...overlap, id: 'stay-a', city: 'Makkah', hotel: 'Hotel' }]
    p.status = 'draft'
    expect(packageSchema.safeParse(p).success).toBe(false)
  })
  it('validates program and stay dates against the Hajj season', () => {
    const p = completePackage()
    p.status = 'draft'
    p.startDate = '2027-04-08'
    p.endDate = '2027-06-05'
    expect(packageSchema.safeParse(p).success).toBe(true)
    p.startDate = '2027-04-07'
    expect(packageSchema.safeParse(p).success).toBe(false)
    p.startDate = '2027-04-08'
    p.endDate = '2027-06-06'
    expect(packageSchema.safeParse(p).success).toBe(false)
  })
  it('keeps service totals independent from hotel-stay dates and details', () => {
    const p = completePackage()
    const before = servicePricing(p).total
    editorData(p).stays[0].notes = 'Different hotel note'
    expect(servicePricing(p).total).toBe(before)
    expect(readiness(p)).toEqual([])
  })
  it('hydrates historical out-of-window packages without changing hotel or block data', () => {
    const seed = seedPackageData()
    const p = completePackage()
    p.id = seed.packages[0].id
    p.status = 'draft'
    p.startDate = '2026-10-01'
    p.endDate = '2026-10-30'
    editorData(p).stays = editorData(p).stays.map((stay) => ({
      ...stay,
      checkIn: '2026-10-10',
      checkOut: '2026-10-13'
    }))
    const old = { ...seed, packages: [p] }
    const current = migratePackageState(old, 6)
    expect(current.packages[0].status).toBe('draft')
    expect(current.packages[0].startDate).toBe(p.startDate)
    expect(current.packages[0].editor?.stays).toEqual(p.editor?.stays)
    expect(current.blocks).toEqual(old.blocks)
    expect(packageSchema.safeParse(current.packages[0]).success).toBe(false)
  })
})
