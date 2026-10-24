import type { InternationalFlightRequest } from '../types/domain'
/** Calculates the whole round-trip ticket including flat profit, then converts to SAR. @param record - Ticket inputs in booking currency. @returns Minor-unit final prices, or null for incomplete input. */
export function flightPricing(
  record: Pick<InternationalFlightRequest, 'currency' | 'ticketPrice' | 'profit' | 'euroRate'>
) {
  const { ticketPrice, profit, currency, euroRate } = record
  if (
    !currency ||
    ticketPrice === undefined ||
    profit === undefined ||
    ![ticketPrice, profit].every(
      (v) => Number.isFinite(v) && v >= 0 && Number(v.toFixed(2)) === v && v <= 1_000_000_000
    )
  )
    return null
  const final = BigInt(Math.round(ticketPrice * 100)) + BigInt(Math.round(profit * 100))
  const rate = currency === 'SAR' ? 1 : currency === 'USD' ? 3.8 : euroRate
  const validRate =
    rate !== undefined &&
    Number.isFinite(rate) &&
    rate > 0 &&
    rate <= 1_000_000 &&
    Number(rate.toFixed(6)) === rate
  const sar = validRate ? (final * BigInt(Math.round(rate * 1_000_000)) + 500000n) / 1000000n : null
  return {
    final: Number(final),
    sar: sar !== null && sar <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(sar) : null,
    rate: validRate ? rate : undefined
  }
}
