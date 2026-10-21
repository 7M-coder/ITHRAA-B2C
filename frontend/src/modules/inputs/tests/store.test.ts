import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INPUTS_STORAGE_KEY, useInputsStore, useInputsStorageStatus } from '../hooks/useInputsStore'
import type { InternationalFlightRequest } from '../types/domain'

const request: InternationalFlightRequest = {
  id: 'request-1',
  pnr: 'DIBXE2',
  arrivalDate: '2025-05-15',
  arrivalRoute: 'FRA DXB MED',
  departureDate: '2025-06-06',
  departureRoute: 'JED DXB FRA',
  currency: 'EUR',
  fare: 1220,
  otherTaxes: 186.34,
  farePerPassenger: 1406,
  passengersRequested: 35,
  totalFare: 49221.9
}

describe('flight booking requests', () => {
  beforeEach(() => {
    localStorage.clear()
    useInputsStore.setState({ requests: [] })
  })

  it('creates, updates, and deletes a persisted request', () => {
    useInputsStore.getState().saveRequest(request)
    expect(useInputsStorageStatus.getState().error).toBe(false)
    useInputsStore.getState().saveRequest({ ...request, passengersRequested: 40 })
    expect(useInputsStore.getState().requests).toHaveLength(1)
    expect(
      JSON.parse(localStorage.getItem(INPUTS_STORAGE_KEY) ?? '{}').state.requests[0]
        .passengersRequested
    ).toBe(40)
    useInputsStore.getState().deleteRequest(request.id)
    expect(useInputsStore.getState().requests).toEqual([])
  })

  it('updates a matching PNR and route on repeated import', () => {
    useInputsStore.getState().saveRequest(request)
    useInputsStore
      .getState()
      .importRequests([{ ...request, id: 'spreadsheet-id', totalFare: 50000 }])
    expect(useInputsStore.getState().requests).toHaveLength(1)
    expect(useInputsStore.getState().requests[0].totalFare).toBe(50000)
  })

  it('preserves unreadable storage data', async () => {
    localStorage.setItem(INPUTS_STORAGE_KEY, 'invalid json')
    vi.resetModules()
    const { useInputsStore: reloaded, useInputsStorageStatus: status } =
      await import('../hooks/useInputsStore')
    expect(status.getState().error).toBe(true)
    reloaded.getState().saveRequest(request)
    expect(localStorage.getItem(INPUTS_STORAGE_KEY)).toBe('invalid json')
  })
})
