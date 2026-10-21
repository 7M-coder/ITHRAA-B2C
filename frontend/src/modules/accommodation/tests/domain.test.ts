import { describe, expect, it } from 'vitest'
import {
  accommodationSchema,
  accommodationWriteSchema,
  accommodationDateRules
} from '../validations/schemas'
import { record } from './fixtures'

describe('housing invariants', () => {
  it('allows exact capacity and unused capacity, counts suites once and keeps leading zeroes', () => {
    expect(accommodationSchema.parse(record).unifiedNumber).toBe('0012345678')
    expect(accommodationSchema.safeParse({ ...record, capacity: 101 }).success).toBe(true)
  })
  it.each([99, 0, -1, 1.5])('rejects invalid capacity %s', (capacity) =>
    expect(accommodationSchema.safeParse({ ...record, capacity }).success).toBe(false)
  )
  it.each([-1, 1.5])('rejects invalid room count %s', (double) =>
    expect(
      accommodationSchema.safeParse({ ...record, rooms: { ...record.rooms, double } }).success
    ).toBe(false)
  )
  it.each([
    [],
    [{ start: '2027-04-09', end: '2027-06-05' }],
    [{ start: '2027-04-08', end: '2027-06-06' }],
    [
      { start: '2027-04-08', end: '2027-05-01' },
      { start: '2027-05-03', end: '2027-06-05' }
    ],
    [
      { start: '2027-04-08', end: '2027-05-01' },
      { start: '2027-04-30', end: '2027-06-05' }
    ],
    [{ start: '2027-04-08', end: '2027-04-08' }]
  ])('rejects incomplete or invalid contract coverage %j', (...periods) => {
    expect(accommodationSchema.safeParse({ ...record, periods }).success).toBe(false)
  })
  it('requires board only when catering is included and clears obsolete board', () => {
    expect(accommodationSchema.safeParse({ ...record, catering: true }).success).toBe(false)
    expect(
      accommodationSchema.safeParse({ ...record, catering: true, board: 'full' }).success
    ).toBe(true)
    expect(accommodationSchema.parse({ ...record, board: 'half' }).board).toBeUndefined()
  })
  it('rejects unsafe text and invalid calendar dates', () => {
    expect(accommodationSchema.safeParse({ ...record, name: '<script>' }).success).toBe(false)
    expect(accommodationSchema.safeParse({ ...record, contractStart: '2027-02-30' }).success).toBe(
      false
    )
  })
})

it('requires a valid price for writes without invalidating old records', () => {
  const legacy = { ...record, contractPrice: undefined }
  expect(accommodationSchema.safeParse(legacy).success).toBe(true)
  expect(accommodationWriteSchema.safeParse(legacy).success).toBe(false)
  for (const price of [-1, Infinity, NaN, 1.001])
    expect(accommodationWriteSchema.safeParse({ ...record, contractPrice: price }).success).toBe(
      false
    )
  for (const price of [0, record.contractPrice])
    expect(
      accommodationWriteSchema.parse({
        ...record,
        roomRates: {
          double: price === 0 ? 0 : 10,
          triple: price === 0 ? 0 : 10,
          quadruple: price === 0 ? 0 : 10,
          suites: price === 0 ? 0 : 10
        },
        contractPrice: price
      }).contractPrice
    ).toBe(price)
})
it('rejects reversed contract and period dates in store validation', () => {
  expect(accommodationWriteSchema.safeParse({ ...record, contractEnd: '2027-04-07' }).success).toBe(
    false
  )
  expect(
    accommodationWriteSchema.safeParse({
      ...record,
      periods: [{ start: '2027-04-08', end: '2027-04-07' }]
    }).success
  ).toBe(false)
})
it('validates related date fields before submission, including changed dependencies', async () => {
  const values = structuredClone(record)
  const getValue = (path: unknown) =>
    (Array.isArray(path) ? path : [path]).reduce((value, key) => value?.[key], values)
  const messages = { invalid: 'invalid', range: 'range', coverage: 'coverage', order: 'order' }
  const end = accommodationDateRules(getValue, 'contractEnd', messages)[0] as {
    validator: (_: unknown, value: unknown) => Promise<void>
  }
  await expect(end.validator({}, '2027-04-07')).rejects.toThrow('range')
  await expect(end.validator({}, '2027-04-08')).rejects.toThrow('range')
  const next = accommodationDateRules(getValue, 'start', messages, 1)[0] as {
    validator: (_: unknown, value: unknown) => Promise<void>
  }
  await expect(next.validator({}, '2027-04-30')).rejects.toThrow('order')
  await expect(next.validator({}, '2027-05-01')).resolves.toBeUndefined()
  values.periods[0].end = '2027-05-02'
  await expect(next.validator({}, '2027-05-01')).rejects.toThrow('order')
})

it('accepts next-day starts through schema and field validation, but rejects longer gaps', async () => {
  const periods = [
    { start: '2027-04-08', end: '2027-05-01' },
    { start: '2027-05-02', end: '2027-06-05' }
  ]
  expect(
    accommodationWriteSchema.safeParse({ ...record, periods, contractPrice: 220875 }).success
  ).toBe(true)
  const values = { ...record, periods }
  const getValue = (path: unknown) =>
    (Array.isArray(path) ? path : [path]).reduce((value, key) => value?.[key], values)
  const rules = accommodationDateRules(
    getValue,
    'start',
    { invalid: 'invalid', range: 'range', coverage: 'coverage', order: 'order' },
    1
  )[0] as { validator: (_: unknown, value: unknown) => Promise<void> }
  await expect(rules.validator({}, '2027-05-02')).resolves.toBeUndefined()
  await expect(rules.validator({}, '2027-05-01')).resolves.toBeUndefined()
  await expect(rules.validator({}, '2027-04-30')).rejects.toThrow('order')
  await expect(rules.validator({}, '2027-05-03')).rejects.toThrow('coverage')
})
