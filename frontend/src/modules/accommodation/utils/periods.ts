import dayjs from 'dayjs'
/** Allows the next period to start on the previous end date or the following calendar day. @param start - Next start date. @param previousEnd - Previous end date. @returns Whether the dates are adjacent without overlap. */
export function isAdjacentPeriodStart(start: string, previousEnd: string): boolean {
  return start === previousEnd || start === dayjs(previousEnd).add(1, 'day').format('YYYY-MM-DD')
}
