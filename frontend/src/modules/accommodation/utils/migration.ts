import { z } from 'zod'
import { accommodationsSchema } from '../validations/schemas'
/** Adds zero profits and archives recorded contract totals without resetting inventory. @param saved - Previous persisted state. @param version - Previous version. @returns Valid current state. */
export function migrateAccommodationState(saved: unknown, version: number) {
  if (version !== 1) throw new Error('storageVersion')
  const state = z
    .object({ records: accommodationsSchema, demoSeeded: z.boolean().optional() })
    .parse(saved)
  return {
    ...state,
    records: state.records.map((record) => ({
      ...record,
      roomProfits: record.roomProfits ?? { double: 0, triple: 0, quadruple: 0 },
      historical:
        record.historical ??
        (record.contractPrice === undefined ? undefined : { contractPrice: record.contractPrice }),
      contractPrice: undefined
    }))
  }
}
