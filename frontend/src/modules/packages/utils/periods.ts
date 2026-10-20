import type { PackageStay, StayPeriod } from '../types/editor'
import { createEntityId } from './domain'
/** Returns stable legacy-compatible stay periods. @param stay - Stay stage. @returns Stored periods or the original single interval. */
export function stayPeriods(stay: PackageStay): StayPeriod[] {
  return (
    stay.periods ?? [{ id: `${stay.id}-period-1`, checkIn: stay.checkIn, checkOut: stay.checkOut }]
  )
}
/** Updates intervals and keeps original date fields synchronized for legacy readers. @param stay - Original stay. @param periods - Ordered intervals. @returns Updated stay. */
export function withPeriods(stay: PackageStay, periods: StayPeriod[]): PackageStay {
  return {
    ...stay,
    periods,
    checkIn: periods[0]?.checkIn ?? '',
    checkOut: periods.at(-1)?.checkOut ?? ''
  }
}
/** Changes period count without reassigning retained identifiers. @param stay - Stay. @param count - Requested positive integer count. @returns Updated stay. */
export function resizePeriods(stay: PackageStay, count: number): PackageStay {
  if (!Number.isInteger(count) || count < 1 || count > 30) return stay
  const periods = [...stayPeriods(stay)]
  while (periods.length < count)
    periods.push({ id: createEntityId('period'), checkIn: '', checkOut: '' })
  return withPeriods(stay, periods.slice(0, count))
}
