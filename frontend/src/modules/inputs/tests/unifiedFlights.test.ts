import { describe, expect, it, vi } from 'vitest'
import { flightRequestSchema } from '../validations/schemas'
import { migrateFlightState } from '../utils/migration'

const booking = { id: 'synthetic', pnr: 'DEMO', segments: [] }
describe('unified flight fields', () => {
  it('accepts incomplete bookings and preserves zero separately from missing values', () => {
    const result = flightRequestSchema.parse({ ...booking, seats: 0, fare: 0 })
    expect(result.seats).toBe(0)
    expect(result.fare).toBe(0)
    expect(result.otherTaxes).toBeUndefined()
  })
  it('requires a booking reference or flight number', () => {
    expect(flightRequestSchema.safeParse({ ...booking, pnr: '' }).success).toBe(false)
    expect(
      flightRequestSchema.safeParse({
        ...booking,
        pnr: '',
        segments: [{ id: 'a', flightNumber: 'DEMO100' }]
      }).success
    ).toBe(true)
  })
  it('rejects invalid populated fields without converting blanks to zero', () => {
    for (const fields of [
      { fare: -1 },
      { seats: 1.5 },
      { arrivalDate: '2026-02-30' },
      { paymentPercentage: 101 },
      { segments: [{ id: 'a', departureTime: '25:00' }] }
    ])
      expect(flightRequestSchema.safeParse({ ...booking, ...fields }).success).toBe(false)
    expect(flightRequestSchema.parse({ ...booking, fare: null }).fare).toBeUndefined()
  })
  it('retains multiple segments, source fields and independent financial values', () => {
    const segments = [
      { id: 'a', flightNumber: 'DEMO1', departureDateH: 'source date', arrivalDayOffset: 1 },
      { id: 'b', flightNumber: 'DEMO2', capacity: 0 }
    ]
    const result = flightRequestSchema.parse({
      ...booking,
      segments,
      issuedNames: 'source value',
      fare: 100,
      totalFare: 777,
      exchangeRate: 4.36,
      firstPayment: 0
    })
    expect(result.segments).toEqual(segments)
    expect(result.totalFare).toBe(777)
    expect(result.firstPayment).toBe(0)
  })
  it('migrates old requests without inventing segments or changing amounts and IDs', () => {
    expect(
      migrateFlightState({
        requests: [{ id: 'old', pnr: 'DEMO', arrivalRoute: 'AAA BBB', totalFare: 17 }]
      }).requests[0]
    ).toMatchObject({ id: 'old', totalFare: 17, arrivalRoute: 'AAA BBB', segments: [] })
    expect(() => migrateFlightState({ requests: [{ id: 'bad' }] })).toThrow()
  })
  it('saves and rehydrates ordered segments and distinct source amounts', async () => {
    vi.resetModules()
    const { useInputsStore } = await import('../hooks/useInputsStore')
    const record = {
      ...booking,
      fare: 100,
      totalFare: 500,
      segments: [
        { id: 'b', flightNumber: 'DEMO2' },
        { id: 'a', flightNumber: 'DEMO1' }
      ]
    }
    useInputsStore.getState().saveRequest(record)
    await useInputsStore.persist.rehydrate()
    expect(useInputsStore.getState().requests[0]).toMatchObject(record)
    useInputsStore.getState().deleteRequest(record.id)
    await useInputsStore.persist.rehydrate()
    expect(useInputsStore.getState().requests).toEqual([])
  })
  it('preserves the previous persisted data when saving fails', async () => {
    vi.resetModules()
    const { useInputsStore, useInputsStorageStatus, INPUTS_STORAGE_KEY } =
      await import('../hooks/useInputsStore')
    useInputsStore.getState().saveRequest(booking)
    const before = localStorage.getItem(INPUTS_STORAGE_KEY)
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => useInputsStore.getState().saveRequest({ ...booking, fare: 123 })).toThrow(
      'storage'
    )
    expect(useInputsStorageStatus.getState().error).toBe(true)
    expect(localStorage.getItem(INPUTS_STORAGE_KEY)).toBe(before)
    spy.mockRestore()
  })
})
