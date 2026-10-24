import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFlightSeed } from '../utils/seed'
import { flightRequestsSchema } from '../validations/schemas'

const key = 'ithraa-b2c-flight-requests-v1'

describe('first-use flight demo persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('seeds valid direct and connecting bookings and persists them immediately', async () => {
    const { useInputsStore } = await import('../hooks/useInputsStore')
    const records = useInputsStore.getState().requests
    expect(records).toEqual(createFlightSeed())
    expect(flightRequestsSchema.safeParse(records).success).toBe(true)
    expect(
      records.some((record) => record.inbound.length === 1 && record.outbound.length === 1)
    ).toBe(true)
    expect(
      records.some((record) => record.inbound.length === 2 && record.outbound.length === 2)
    ).toBe(true)
    expect(JSON.parse(localStorage.getItem(key)!).state.requests).toEqual(records)
  })

  it('retains edits, additions and deletions after reloading the store', async () => {
    const { useInputsStore } = await import('../hooks/useInputsStore')
    const [first, second] = useInputsStore.getState().requests
    useInputsStore.getState().saveRequest({ ...first, seats: 12 })
    useInputsStore
      .getState()
      .saveRequest({ id: 'manual', pnr: 'CUSTOM', inbound: [], outbound: [] })
    useInputsStore.getState().deleteRequest(second.id)
    const expected = useInputsStore.getState().requests
    vi.resetModules()
    const reloaded = await import('../hooks/useInputsStore')
    expect(reloaded.useInputsStore.getState().requests).toEqual(expected)
  })

  it('does not reseed a saved empty list or replace existing bookings', async () => {
    localStorage.setItem(key, JSON.stringify({ version: 2, state: { requests: [] } }))
    const { useInputsStore } = await import('../hooks/useInputsStore')
    expect(useInputsStore.getState().requests).toEqual([])
    useInputsStore
      .getState()
      .saveRequest({ id: 'existing', pnr: 'SAVED', inbound: [], outbound: [] })
    vi.resetModules()
    const reloaded = await import('../hooks/useInputsStore')
    expect(reloaded.useInputsStore.getState().requests).toEqual([
      { id: 'existing', pnr: 'SAVED', inbound: [], outbound: [] }
    ])
    reloaded.useInputsStore.getState().deleteRequest('existing')
    await reloaded.useInputsStore.persist.rehydrate()
    expect(reloaded.useInputsStore.getState().requests).toEqual([])
  })

  it('warns if storage is unavailable without showing unsaved demo records', async () => {
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { useInputsStore, useInputsStorageStatus } = await import('../hooks/useInputsStore')
    expect(useInputsStorageStatus.getState().error).toBe(true)
    expect(useInputsStore.getState().requests).toEqual([])
    spy.mockRestore()
  })
})
