import { z } from 'zod'
import { flightRequestsSchema } from '../validations/schemas'
import { legacyFlightRequestsSchema } from '../validations/legacySchemas'
/** Preserves old values without guessing direction or tax inclusion. @param saved - Version 1 or 2 persisted state. @param version - Previous storage version. @returns Valid version 3 state. */
export function migrateFlightState(saved: unknown, version = 2) {
  if (version !== 1 && version !== 2) throw new Error('storageVersion')
  const state = z.object({ requests: z.array(z.record(z.unknown())) }).parse(saved)
  legacyFlightRequestsSchema.parse(
    state.requests.map((record) => ({
      ...record,
      pnr: record.pnr || record.recordNumber,
      segments: record.segments ?? []
    }))
  )
  return {
    requests: flightRequestsSchema.parse(
      state.requests.map((record) => ({
        id: record.id,
        pnr: record.pnr || record.recordNumber,
        country: record.country,
        notes: record.notes,
        seats: record.seats ?? record.passengersRequested,
        currency: ['SAR', 'EUR', 'USD'].includes(String(record.currency))
          ? record.currency
          : undefined,
        profit: 0,
        inbound: [],
        outbound: [],
        historical: record
      }))
    )
  }
}
