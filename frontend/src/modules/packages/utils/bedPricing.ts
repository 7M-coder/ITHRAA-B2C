import type { BedTaxRates } from '../types/editor'
export const BED_TAX_RATES: BedTaxRates = { vat: 15, accommodation: 5, collection: 2, city: 3 }
/** Adds each user-specified rate to the same untaxed base, retaining precision. @param base - Price before additions. @param rates - Recorded rates. @returns Raw line amounts and total, or null for missing/invalid input. */
export function bedPrice(base: number | null, rates: BedTaxRates = BED_TAX_RATES) {
  if (
    base === null ||
    !Number.isFinite(base) ||
    base < 0 ||
    Object.values(rates).some((v) => !Number.isFinite(v) || v < 0 || v > 100)
  )
    return null
  const vat = (base * rates.vat) / 100,
    accommodation = (base * rates.accommodation) / 100,
    collection = (base * rates.collection) / 100,
    city = (base * rates.city) / 100
  return {
    base,
    vat,
    accommodation,
    collection,
    city,
    total: base + vat + accommodation + collection + city
  }
}
