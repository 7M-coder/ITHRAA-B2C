import dayjs from 'dayjs'
/** Offsets an ISO calendar date for inclusive picker bounds. @param value - ISO date. @param days - Day offset. @returns Shifted date or undefined. */
export function shiftDate(value: string, days: number): string | undefined {
  return value && dayjs(value).isValid()
    ? dayjs(value).add(days, 'day').format('YYYY-MM-DD')
    : undefined
}
/** Finds the earliest configured calendar bound. @param values - Optional ISO dates. @returns Earliest configured date. */
export function earliestDate(...values: (string | undefined)[]) {
  return values.filter((v): v is string => Boolean(v)).sort()[0]
}
/** Finds the latest configured calendar bound. @param values - Optional ISO dates. @returns Latest configured date. */
export function latestDate(...values: (string | undefined)[]) {
  return values
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)
}

export const SEASON_START = '2027-04-08'
export const SEASON_END = '2027-06-05'
/** Checks configured program bounds without requiring incomplete draft dates. @param date - ISO date or blank. @returns Whether the value is inside the season. */
export function isSeasonDate(date: string) {
  return !date || (date >= SEASON_START && date <= SEASON_END)
}
