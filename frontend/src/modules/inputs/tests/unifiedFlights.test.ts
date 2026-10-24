import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flightRequestSchema } from '../validations/schemas'
import { migrateFlightState } from '../utils/migration'
import { flightPricing } from '../utils/pricing'
beforeEach(() => {
  localStorage.setItem(
    'ithraa-b2c-flight-requests-v1',
    JSON.stringify({ version: 3, state: { requests: [] } })
  )
})
const booking = { id: 'test-booking', pnr: 'DEMO', inbound: [], outbound: [] }
describe('directional flight bookings', () => {
  it('retains zero separately from missing price and rejects invalid input', () => {
    expect(flightRequestSchema.parse({ ...booking, seats: 0, ticketPrice: 0 }).ticketPrice).toBe(0)
    expect(flightRequestSchema.parse(booking).ticketPrice).toBeUndefined()
    for (const fields of [
      { ticketPrice: -1 },
      { profit: -1 },
      { ticketPrice: 1.001 },
      { seats: 1.5 },
      { euroRate: 0 },
      { currency: 'CAD' },
      { inbound: [{ id: 'a', departureTime: '25:00' }] },
      { inbound: [{ id: 'a', departureDate: '2027-02-30' }] },
      { inbound: [{ id: 'a', departureDate: '2027-05-20', arrivalDate: '2027-05-19' }] }
    ])
      expect(flightRequestSchema.safeParse({ ...booking, ...fields }).success).toBe(false)
  })
  it('allows incomplete flight-number-only bookings', () => {
    expect(flightRequestSchema.safeParse({ ...booking, pnr: '' }).success).toBe(false)
    expect(
      flightRequestSchema.safeParse({
        ...booking,
        pnr: '',
        outbound: [{ id: 'a', flightNumber: 'DEMO1' }]
      }).success
    ).toBe(true)
  })
  it('prices a full round trip with flat profit before currency conversion', () => {
    expect(flightPricing({ currency: 'SAR', ticketPrice: 100, profit: 10 })).toMatchObject({
      final: 11000,
      sar: 11000
    })
    expect(flightPricing({ currency: 'USD', ticketPrice: 100, profit: 10 })).toMatchObject({
      final: 11000,
      sar: 41800,
      rate: 3.8
    })
    expect(
      flightPricing({ currency: 'EUR', ticketPrice: 100, profit: 10, euroRate: 4.2 })
    ).toMatchObject({ final: 11000, sar: 46200 })
    expect(flightPricing({ currency: 'EUR', ticketPrice: 100, profit: 0 })).toMatchObject({
      final: 10000,
      sar: null
    })
    expect(flightPricing({ currency: 'SAR', ticketPrice: 0, profit: 0 })).toMatchObject({
      final: 0,
      sar: 0
    })
    expect(flightPricing({ currency: 'SAR', profit: 0 })).toBeNull()
    expect(
      flightPricing({ currency: 'EUR', ticketPrice: 0.1, profit: 0.2, euroRate: 4.365 })
    ).toMatchObject({ final: 30, sar: 131 })
  })
  it('migrates without inventing tax-inclusive prices or assigning old flight directions', () => {
    const old = {
      id: 'old',
      pnr: 'DEMO',
      recordNumber: 'different',
      fare: 100,
      totalFare: 500,
      passengersRequested: 40,
      segments: [{ id: 'leg', flightNumber: 'DEMO1' }]
    }
    const migrated = migrateFlightState({ requests: [old] }).requests[0]
    expect(migrated).toMatchObject({
      id: 'old',
      pnr: 'DEMO',
      seats: 40,
      inbound: [],
      outbound: [],
      historical: old
    })
    expect(migrated.ticketPrice).toBeUndefined()
    const fallback = {
      id: 'fallback',
      recordNumber: 'REF',
      segments: [{ id: 'a', flightNumber: 'DEMO2' }]
    }
    expect(migrateFlightState({ requests: [fallback] }).requests[0].pnr).toBe('REF')
    expect(() => migrateFlightState({ requests: [{ id: 'bad' }] })).toThrow()
    expect(() => migrateFlightState({ requests: [] }, 99)).toThrow()
  })
  it('preserves ordered stable flight IDs and distinct carriers on reload', async () => {
    vi.resetModules()
    const { useInputsStore: store } = await import('../hooks/useInputsStore')
    const record = {
      ...booking,
      profit: 0,
      inbound: [
        { id: 'b', flightNumber: 'DEMO2', carrier: 'Carrier B' },
        { id: 'a', flightNumber: 'DEMO1', carrier: 'Carrier A' }
      ],
      outbound: [{ id: 'c', flightNumber: 'DEMO3' }]
    }
    store.getState().saveRequest(record)
    await store.persist.rehydrate()
    expect(store.getState().requests[0]).toMatchObject(record)
    store.getState().saveRequest({ ...record, inbound: [record.inbound[1]] })
    await store.persist.rehydrate()
    expect(store.getState().requests[0].inbound).toEqual([record.inbound[1]])
  })
  it('preserves both memory and stored records when saving fails', async () => {
    vi.resetModules()
    const {
      useInputsStore: store,
      useInputsStorageStatus: status,
      INPUTS_STORAGE_KEY: key
    } = await import('../hooks/useInputsStore')
    store.getState().saveRequest(booking)
    const before = localStorage.getItem(key)
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => store.getState().saveRequest({ ...booking, profit: 10 })).toThrow('storage')
    expect(status.getState().error).toBe(true)
    expect(localStorage.getItem(key)).toBe(before)
    expect(store.getState().requests[0].profit).toBeUndefined()
    spy.mockRestore()
  })
})

it('hydrates a version 2 booking and retains its source values through a version 3 save', async () => {
  const key = 'ithraa-b2c-flight-requests-v1'
  const old = {
    id: 'previous-booking',
    pnr: 'DEMO-OLD',
    recordNumber: 'OTHER',
    currency: 'USD',
    fare: 100,
    otherTaxes: 20,
    totalFare: 4000,
    segments: [{ id: 'previous-leg', flightNumber: 'DEMO1', from: 'AAA', to: 'BBB' }]
  }
  localStorage.setItem(key, JSON.stringify({ version: 2, state: { requests: [old] } }))
  vi.resetModules()
  const { useInputsStore: store, useInputsStorageStatus: status } =
    await import('../hooks/useInputsStore')
  expect(status.getState().error).toBe(false)
  expect(store.getState().requests[0]).toMatchObject({
    id: old.id,
    pnr: old.pnr,
    historical: old,
    inbound: [],
    outbound: []
  })
  expect(store.getState().requests[0].ticketPrice).toBeUndefined()
  store.getState().saveRequest({
    ...store.getState().requests[0],
    currency: 'USD',
    ticketPrice: 100,
    profit: 10,
    inbound: [{ id: 'classified-leg', flightNumber: 'DEMO1' }]
  })
  await store.persist.rehydrate()
  expect(store.getState().requests[0].historical).toEqual(old)
  expect(JSON.parse(localStorage.getItem(key)!).version).toBe(3)
})
