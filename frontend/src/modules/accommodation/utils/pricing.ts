import type { RoomCounts } from '../types/domain'
import { bedsPerRoom, pricedRoomTypes, roomTypes } from './rooms'
import type { HousingPricing, RoomRates } from '../types/pricing'
export type { RoomRates } from '../types/pricing'
export const housingTaxRates = { vat: 15, city: 3, accommodation: 5, collection: 2 } as const
/** Converts a two-decimal SAR value to safe integer halalas. @param amount - SAR amount. @returns Halalas or null for invalid money. */
export function toHalalas(amount: unknown): number | null {
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    Number(amount.toFixed(2)) !== amount
  )
    return null
  const scaled = Math.round(amount * 100)
  return Number.isSafeInteger(scaled) ? scaled : null
}
/** Prices all rooms for the full contract, rounding each independent tax to a halala. @param rooms - Room counts. @param rates - Untaxed per-room contract rates. @returns Integer-halala totals, or null while incomplete or invalid. */
export function housingPricing(
  rooms: Partial<RoomCounts> = {},
  rates: RoomRates = {}
): HousingPricing | null {
  let base = 0n
  for (const key of roomTypes) {
    const count = rooms[key]
    if (count === undefined || !Number.isSafeInteger(count) || count < 0) return null
    if (count === 0) continue
    const rate = toHalalas(rates[key])
    if (rate === null) return null
    base += BigInt(count) * BigInt(rate)
  }
  const taxes = {} as HousingPricing['taxes']
  let total = base
  for (const key of Object.keys(housingTaxRates) as (keyof typeof housingTaxRates)[]) {
    const tax = (base * BigInt(housingTaxRates[key]) + 50n) / 100n
    taxes[key] = Number(tax)
    total += tax
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) return null
  return { base: Number(base), taxes, total: Number(total) }
}

/** Adds independent taxes to one bed's nightly rate. @param rate - Untaxed nightly bed price in SAR. @returns Rounded halala totals or null for an invalid or missing rate. */
export function nightlyBedPricing(rate: unknown): HousingPricing | null {
  if (toHalalas(rate) === null) return null
  return housingPricing(
    { double: 1, triple: 0, quadruple: 0, suites: 0 },
    { double: rate as number }
  )
}

/** Sums occupied nights, excluding same-day handovers and days between periods. @param periods - Contract periods. @returns Night count or null for incomplete dates. */
export function contractNights(periods: { start: string; end: string }[] = []): number | null {
  let nights = 0
  if (!periods.length) return null
  for (const period of periods) {
    const start = Date.parse(period.start),
      end = Date.parse(period.end)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(period.start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(period.end) ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    )
      return null
    if (
      new Date(start).toISOString().slice(0, 10) !== period.start ||
      new Date(end).toISOString().slice(0, 10) !== period.end
    )
      return null
    nights += (end - start) / 86400000
  }
  return Number.isSafeInteger(nights) ? nights : null
}
/** Prices beds per night according to room occupancy. @param rooms - Room counts. @param rates - Per-bed nightly rates. @param periods - Contract periods. @param suiteBeds - Beds in one suite. @returns Taxed halala totals or null if incomplete. */
export function bedNightPricing(
  rooms: Partial<RoomCounts> = {},
  rates: RoomRates = {},
  periods: { start: string; end: string }[] = [],
  suiteBeds?: number
): HousingPricing | null {
  const nights = contractNights(periods)
  if (nights === null) return null
  if ((rooms.suites ?? 0) > 0 && (!suiteBeds || !Number.isSafeInteger(suiteBeds) || suiteBeds < 1))
    return null
  const occupancy = { double: 2, triple: 3, quadruple: 4, suites: suiteBeds ?? 0 }
  const bedNights = {} as RoomCounts
  for (const key of roomTypes) {
    if (rooms[key] === undefined) return null
    bedNights[key] = rooms[key]! * occupancy[key] * nights
  }
  return housingPricing(bedNights, rates)
}

/** Prices double, triple and quadruple beds for all contract nights. @param rooms - Room counts. @param rates - Per-bed nightly rates. @param periods - Contract periods. @returns Taxed halala totals or null if incomplete. */
export function pricedBedNightPricing(
  rooms: Partial<RoomCounts> = {},
  rates: RoomRates = {},
  periods: { start: string; end: string }[] = []
): HousingPricing | null {
  const nights = contractNights(periods)
  if (nights === null) return null
  const bedNights = { double: 0, triple: 0, quadruple: 0, suites: 0 }
  for (const key of pricedRoomTypes) {
    const count = rooms[key]
    if (count === undefined || !Number.isSafeInteger(count) || count < 0) return null
    bedNights[key] = count * bedsPerRoom[key] * nights
  }
  return housingPricing(bedNights, rates)
}

/** Adds each room type's beds multiplied by its per-bed nightly quote, without multiplying by nights. @param rooms - Room counts. @param rates - Per-bed nightly quotes. @param suiteBeds - Beds per suite. @returns Taxed halala totals or null for incomplete input. */
export function bedRatePricing(
  rooms: Partial<RoomCounts> = {},
  rates: RoomRates = {},
  suiteBeds?: number
): HousingPricing | null {
  if ((rooms.suites ?? 0) > 0 && (!suiteBeds || !Number.isSafeInteger(suiteBeds) || suiteBeds < 1))
    return null
  const occupancy = { double: 2, triple: 3, quadruple: 4, suites: suiteBeds ?? 0 }
  const beds = {} as RoomCounts
  for (const key of roomTypes) {
    if (rooms[key] === undefined) return null
    beds[key] = rooms[key]! * occupancy[key]
  }
  return housingPricing(beds, rates)
}

/** Adds a flat per-bed nightly profit after taxes on the original base. @param rate - Untaxed nightly bed rate. @param profit - Flat nightly profit in SAR. @returns Tax breakdown and final minor-unit price or null. */
export function nightlyBedSellingPricing(rate: unknown, profit: unknown = 0) {
  const pricing = nightlyBedPricing(rate)
  const margin = toHalalas(profit)
  if (!pricing || margin === null || !Number.isSafeInteger(pricing.total + margin)) return null
  return { ...pricing, profit: margin, total: pricing.total + margin }
}
