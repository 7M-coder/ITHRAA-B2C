import type { RoomCounts } from './domain'
export type RoomRates = Partial<Record<keyof RoomCounts, number>>
export type HousingTax = 'vat' | 'city' | 'accommodation' | 'collection'
export interface HousingPricing {
  base: number
  taxes: Record<HousingTax, number>
  total: number
}
