import type { ServicePrice, ServicePriceId } from '../types/editor'

export const SERVICE_VAT_RATE = 15

export const REQUIRED_SERVICE_PRICE_IDS: ServicePriceId[] = [
  'intercityBus',
  'intercityTrain',
  'makkahMashairBus',
  'mashairTrain',
  'prayerBus',
  'enrichmentVisitsBus',
  'meals',
  'baggageHandling',
  'giftPackage',
  'simCard'
]

export const OPTIONAL_SERVICE_PRICE_IDS: ServicePriceId[] = [
  'wheelchairCompanion',
  'zamzam',
  'operatingFees'
]

export const SERVICE_PRICE_IDS: ServicePriceId[] = [
  ...REQUIRED_SERVICE_PRICE_IDS,
  ...OPTIONAL_SERVICE_PRICE_IDS
]

/** Creates the fixed service price catalog for a new package. @returns Default service prices. */
export function createDefaultServicePrices(): ServicePrice[] {
  return SERVICE_PRICE_IDS.map((id) => ({
    id,
    amount: null,
    enabled: REQUIRED_SERVICE_PRICE_IDS.includes(id)
  }))
}

/** Calculates VAT and a service's tax-inclusive price without intermediate rounding. @param amount - Per-pilgrim price before VAT. @returns Price components, or null for invalid input. */
export function servicePriceWithVat(amount: number | null) {
  if (amount === null || !Number.isFinite(amount) || amount < 0) return null
  const vat = (amount * SERVICE_VAT_RATE) / 100
  return { base: amount, vat, total: amount + vat }
}

/** Rounds a currency amount to two decimals for display and final package totals. @param amount - Raw amount. @returns Rounded amount. */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
