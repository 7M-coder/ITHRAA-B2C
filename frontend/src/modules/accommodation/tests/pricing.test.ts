import { describe, expect, it } from 'vitest'
import {
  housingPricing,
  nightlyBedPricing,
  bedRatePricing,
  bedNightPricing,
  pricedBedNightPricing,
  contractNights,
  toHalalas
} from '../utils/pricing'
import { accommodationWriteSchema, accommodationSchema } from '../validations/schemas'
import { currentRecord, record } from './fixtures'
describe('room contract pricing', () => {
  it('prices every room type and applies all taxes to the same base', () => {
    expect(
      housingPricing(
        { double: 2, triple: 3, quadruple: 4, suites: 1 },
        { double: 100, triple: 200, quadruple: 300, suites: 400 }
      )
    ).toEqual({
      base: 240000,
      taxes: { vat: 36000, city: 7200, accommodation: 12000, collection: 4800 },
      total: 300000
    })
  })
  it('rounds each tax independently in halalas, including half-halala ties', () => {
    expect(
      housingPricing({ double: 1, triple: 0, quadruple: 0, suites: 0 }, { double: 0.1 })
    ).toEqual({ base: 10, taxes: { vat: 2, city: 0, accommodation: 1, collection: 0 }, total: 13 })
    expect(toHalalas(0.29)).toBe(29)
  })
  it('ignores zero-count types without inventing their prices', () => {
    expect(
      housingPricing({ double: 1, triple: 0, quadruple: 0, suites: 0 }, { double: 100 })?.total
    ).toBe(12500)
    expect(housingPricing({ double: 0, triple: 0, quadruple: 0, suites: 0 })?.total).toBe(0)
    expect(housingPricing(record.rooms, {})).toBeNull()
  })
  it.each([-1, NaN, Infinity, 0.001])('rejects invalid rate %s', (double) => {
    expect(housingPricing(record.rooms, { ...record.roomRates, double })).toBeNull()
    expect(
      accommodationWriteSchema.safeParse({ ...record, roomRates: { ...record.roomRates, double } })
        .success
    ).toBe(false)
  })
  it('prevents unsafe integer totals', () =>
    expect(
      housingPricing(
        { double: Number.MAX_SAFE_INTEGER, triple: 0, quadruple: 0, suites: 0 },
        { double: 1 }
      )
    ).toBeNull())
  it('accepts independent contract totals and requires available room rates', () => {
    expect(accommodationWriteSchema.safeParse(record).success).toBe(true)
    for (const delta of [-0.01, 0.01])
      expect(
        accommodationWriteSchema.safeParse({
          ...record,
          contractPrice: record.contractPrice + delta
        }).success
      ).toBe(true)
    expect(accommodationWriteSchema.safeParse({ ...record, roomRates: undefined }).success).toBe(
      false
    )
  })
  it.each(['123456789', '12345678901', '12345-7890'])(
    'rejects invalid unified number %s',
    (unifiedNumber) =>
      expect(accommodationWriteSchema.safeParse({ ...record, unifiedNumber }).success).toBe(false)
  )
  it('retains leading zeroes, legacy records and same-day period boundaries', () => {
    expect(accommodationWriteSchema.parse(record).unifiedNumber).toBe('0012345678')
    const legacy = { ...record, unifiedNumber: '001234', roomRates: undefined }
    expect(accommodationSchema.parse(legacy).roomRates).toBeUndefined()
    expect(accommodationWriteSchema.safeParse(legacy).success).toBe(false)
    expect(
      accommodationWriteSchema.safeParse({
        ...record,
        periods: [
          { start: '2027-04-08', end: '2027-05-01' },
          { start: '2027-05-01', end: '2027-06-05' }
        ]
      }).success
    ).toBe(true)
  })
})

it.each(['AB12345678', 'أب12345678'])(
  'accepts alphanumeric establishment number %s',
  (unifiedNumber) =>
    expect(accommodationWriteSchema.parse({ ...record, unifiedNumber }).unifiedNumber).toBe(
      unifiedNumber
    )
)

it('prices different nightly bed rates for double, triple, quadruple and suite occupancy', () => {
  const rooms = { double: 2, triple: 1, quadruple: 1, suites: 1 }
  const rates = { double: 10, triple: 20, quadruple: 30, suites: 40 }
  const periods = [{ start: '2027-05-01', end: '2027-05-03' }]
  expect(bedNightPricing(rooms, rates, periods, 5)).toEqual({
    base: 84000,
    taxes: { vat: 12600, city: 2520, accommodation: 4200, collection: 1680 },
    total: 105000
  })
  expect(bedNightPricing(rooms, rates, periods)).toBeNull()
})
it('sums period nights without charging gaps or double-counting handovers', () => {
  expect(
    contractNights([
      { start: '2027-05-01', end: '2027-05-03' },
      { start: '2027-05-03', end: '2027-05-05' }
    ])
  ).toBe(4)
  expect(
    contractNights([
      { start: '2027-05-01', end: '2027-05-03' },
      { start: '2027-05-04', end: '2027-05-06' }
    ])
  ).toBe(4)
  expect(contractNights([{ start: '2027-05-03', end: '2027-05-01' }])).toBeNull()
})
it('preserves legacy room-contract rates on hydration and requires explicit nightly repricing on write', () => {
  const legacy = {
    ...record,
    pricingBasis: undefined,
    roomRates: { double: 1000, triple: 1000, quadruple: 1000, suites: 1000 },
    contractPrice: 125000
  }
  expect(accommodationSchema.parse(legacy).roomRates).toEqual(legacy.roomRates)
  expect(accommodationSchema.parse(legacy).pricingBasis).toBeUndefined()
  expect(accommodationWriteSchema.safeParse(legacy).success).toBe(false)
  expect(housingPricing(legacy.rooms, legacy.roomRates)?.total).toBe(12500000)
})

it('adds beds times the type rate without multiplying by period nights', () => {
  const rooms = { double: 2, triple: 3, quadruple: 4, suites: 0 }
  const rates = { double: 10, triple: 20, quadruple: 30 }
  // 4 beds * 10 + 9 beds * 20 + 16 beds * 30 = 700 SAR before taxes.
  expect(bedRatePricing(rooms, rates)).toEqual({
    base: 70000,
    taxes: { vat: 10500, city: 2100, accommodation: 3500, collection: 1400 },
    total: 87500
  })
  expect(
    accommodationWriteSchema.safeParse({
      ...record,
      periods: [{ start: record.contractStart, end: record.contractEnd }]
    }).success
  ).toBe(true)
})

it('multiplies the nightly bed sum by all period nights before taxes and contract comparison', () => {
  // One nightly base: 310 beds * 10 SAR = 3,100 SAR; 58 nights = 179,800 SAR.
  expect(bedNightPricing(record.rooms, record.roomRates, record.periods, record.suiteBeds)).toEqual(
    {
      base: 17980000,
      taxes: { vat: 2697000, city: 539400, accommodation: 899000, collection: 359600 },
      total: 22475000
    }
  )
  const periods = [
    { start: record.contractStart, end: '2027-04-09' },
    { start: '2027-04-09', end: record.contractEnd }
  ]
  expect(accommodationWriteSchema.safeParse({ ...record, periods }).success).toBe(true)
  expect(accommodationWriteSchema.safeParse({ ...record, contractPrice: 3875 }).success).toBe(true)
})

it('prices only double, triple and quadruple beds for new contracts', () => {
  expect(
    pricedBedNightPricing(currentRecord.rooms, currentRecord.roomRates, currentRecord.periods)
  ).toEqual({
    base: 16820000,
    taxes: { vat: 2523000, city: 504600, accommodation: 841000, collection: 336400 },
    total: 21025000
  })
  expect(accommodationWriteSchema.safeParse(currentRecord).success).toBe(true)
  expect(
    accommodationWriteSchema.safeParse({
      ...currentRecord,
      contractPrice: record.contractPrice
    }).success
  ).toBe(true)
  expect(
    pricedBedNightPricing(
      { ...currentRecord.rooms, double: 50 },
      currentRecord.roomRates,
      currentRecord.periods
    )?.base
  ).toBe(20300000)
})

it('taxes each bed rate independently without room counts, nights or a contract total', () => {
  expect(nightlyBedPricing(100)).toEqual({
    base: 10000,
    taxes: { vat: 1500, city: 300, accommodation: 500, collection: 200 },
    total: 12500
  })
  expect(nightlyBedPricing(80)?.total).toBe(10000)
  expect(nightlyBedPricing(60)?.total).toBe(7500)
  expect(nightlyBedPricing(0.1)).toEqual({
    base: 10,
    taxes: { vat: 2, city: 0, accommodation: 1, collection: 0 },
    total: 13
  })
  expect(nightlyBedPricing(undefined)).toBeNull()
  expect(nightlyBedPricing(0)?.total).toBe(0)
})
