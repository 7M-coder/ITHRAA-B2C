import { describe, expect, it } from 'vitest'
import { bedPrice } from '../utils/bedPricing'
import { newStay, editorData, optionCost, stayPeriodNights, readiness } from '../utils/finance'
import { stayPeriods, resizePeriods, withPeriods } from '../utils/periods'
import { transportModes, validTransport } from '../utils/transport'
import { packageSchema } from '../validations/schemas'
import { migratePackageState } from '../utils/migration'
import { seedPackageData } from '../utils/seed'
import { completePackage } from './fixtures'
describe('bed pricing and stay periods', () => {
  it('adds all four charges on the same 100-riyal base, for every city', () => {
    expect(bedPrice(100)).toEqual({
      base: 100,
      vat: 15,
      accommodation: 5,
      collection: 2,
      city: 3,
      total: 125
    })
    expect(bedPrice(0)?.total).toBe(0)
    for (const value of [null, -1, NaN, Infinity]) expect(bedPrice(value)).toBeNull()
  })
  it('multiplies bed-night price by nights, without dividing by room occupancy', () => {
    const p = completePackage(),
      e = editorData(p)
    e.stays = [
      { ...e.stays[0], rooms: newStay().rooms.map((r) => ({ ...r, enabled: true, amount: 100 })) }
    ]
    e.mode = 'cost_draft'
    e.options[0].selections = { 'stay-a': 4 }
    expect(optionCost(p, e.options[0]).total).toBe(375)
    e.options[0].selections['stay-a'] = 2
    expect(optionCost(p, e.options[0]).total).toBe(375)
  })
  it('sums nights across multiple intervals, preserving their IDs when resizing', () => {
    const original = { ...newStay(), id: 'stay-a', checkIn: '2027-05-01', checkOut: '2027-05-04' }
    const resized = resizePeriods(original, 3)
    expect(stayPeriods(resized)[0].id).toBe('stay-a-period-1')
    expect(new Set(stayPeriods(resized).map((p) => p.id)).size).toBe(3)
    const stay = withPeriods(
      resized,
      stayPeriods(resized).map((p, i) => ({
        ...p,
        checkIn: ['2027-05-01', '2027-05-10', '2027-05-20'][i],
        checkOut: ['2027-05-04', '2027-05-12', '2027-05-24'][i]
      }))
    )
    expect(stayPeriodNights(stay)).toBe(9)
    expect(stay.checkIn).toBe('2027-05-01')
    expect(stay.checkOut).toBe('2027-05-24')
    expect(stayPeriods(resizePeriods(stay, 2))[0].id).toBe(stayPeriods(stay)[0].id)
  })
  it('does not turn missing or overlapping periods into a total', () => {
    const stay = resizePeriods({ ...newStay(), checkIn: '2027-05-01', checkOut: '2027-05-04' }, 2)
    expect(stayPeriodNights(stay)).toBeNull()
    const overlap = withPeriods(
      stay,
      stayPeriods(stay).map((p, i) => ({
        ...p,
        checkIn: i ? '2027-05-03' : '2027-05-01',
        checkOut: i ? '2027-05-05' : '2027-05-04'
      }))
    )
    expect(stayPeriodNights(overlap)).toBeNull()
    const p = completePackage()
    editorData(p).stays = [{ ...overlap, id: 'stay-a', city: 'Makkah', hotel: 'Hotel' }]
    p.status = 'draft'
    expect(packageSchema.safeParse(p).success).toBe(false)
  })
  it('uses every period for the taxable bed total and rounds once at the end', () => {
    const p = completePackage(),
      e = editorData(p),
      stay = e.stays[0]
    e.mode = 'cost_draft'
    e.stays = [
      withPeriods(
        { ...stay, rooms: newStay().rooms.map((r) => ({ ...r, amount: 100, enabled: true })) },
        [
          { id: 'one', checkIn: '2027-05-10', checkOut: '2027-05-13' },
          { id: 'two', checkIn: '2027-05-15', checkOut: '2027-05-17' }
        ]
      )
    ]
    e.options[0].selections = { 'stay-a': 3 }
    const result = optionCost(p, e.options[0])
    expect(result.total).toBe(625)
    expect(result.lines[0]).toMatchObject({ base: 500, additions: 125, tax: 'included' })
    e.stays[0].rooms.find((r) => r.occupancy === 3)!.amount = 0.333
    expect(optionCost(p, e.options[0]).total).toBe(2.08)
  })
  it('retains old cost bases and avoids adding charges twice to inclusive values', () => {
    const p = completePackage(),
      e = editorData(p)
    expect(optionCost(p, e.options[0]).total).toBe(650)
    e.stays = [
      {
        ...e.stays[0],
        rooms: newStay().rooms.map((r) => ({ ...r, enabled: true, amount: 125, tax: 'included' }))
      }
    ]
    e.options[0].selections = { 'stay-a': 2 }
    expect(optionCost(p, e.options[0]).total).toBe(375)
  })
  it('limits program and period writes to April 8 through June 5, inclusive', () => {
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
  it('does not require a package company for an otherwise complete offer', () => {
    const p = completePackage()
    p.providerId = ''
    expect(readiness(p)).toEqual([])
    expect(packageSchema.safeParse(p).success).toBe(true)
  })
  it('exposes exactly the requested transport choices and rejects mixed modes', () => {
    expect(transportModes.intercity).toEqual(['bus', 'haramain_train', 'private_car'])
    expect(transportModes.mashair).toEqual(['bus', 'mashair_train'])
    expect(validTransport('mashair', 'haramain_train')).toBe(false)
    expect(validTransport('intercity', 'private_car')).toBe(true)
    const p = completePackage()
    editorData(p).services = [
      {
        id: 'transport',
        category: 'transportation',
        transportType: 'mashair',
        transportMode: 'haramain_train',
        description: 'Transport',
        included: true
      }
    ]
    expect(packageSchema.safeParse(p).success).toBe(false)
  })
  it('hydrates historical out-of-window records without rewriting dates, costs or block links', () => {
    const seed = seedPackageData()
    const p = completePackage()
    p.id = seed.packages[0].id
    p.startDate = '2026-10-01'
    p.endDate = '2026-10-30'
    editorData(p).stays = editorData(p).stays.map((s) => ({
      ...s,
      checkIn: '2026-10-10',
      checkOut: '2026-10-13'
    }))
    const old = {
      ...seed,
      packages: [
        p,
        ...seed.packages.slice(1).map((item) => ({
          ...item,
          status: 'draft' as const,
          editor: editorData(completePackage())
        }))
      ]
    }
    const current = migratePackageState(old, 3)
    expect(current.packages[0].status).toBe('draft')
    expect(current.packages[0].startDate).toBe(p.startDate)
    expect(current.packages[0].editor?.stays).toEqual(p.editor?.stays)
    expect(current.blocks).toEqual(old.blocks)
    expect(packageSchema.safeParse(current.packages[0]).success).toBe(false)
  })
})
