import { z } from 'zod'
import { flightRequestsSchema } from '../validations/schemas'

/** Adds empty segment lists to legacy requests without inventing flight details. @param saved - Persisted store state. @returns Valid migrated state, or throws without overwriting source data. */
export function migrateFlightState(saved: unknown) {
  const state = z.object({ requests: z.array(z.record(z.unknown())) }).parse(saved)
  return {
    requests: flightRequestsSchema.parse(
      state.requests.map((record) => ({ ...record, segments: record.segments ?? [] }))
    )
  }
}
