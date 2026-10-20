export type TaxTreatment = 'included' | 'excluded' | 'unknown'
export type PricingMode = 'approved_price' | 'cost_draft'
export interface StayRoom {
  occupancy: number
  enabled: boolean
  beds: number | null
  amount: number | null
  basis: 'room_night' | 'bed_stay' | 'bed_night'
  legacyAmount?: number | null
  legacyBasis?: 'room_night' | 'bed_stay'
  tax: TaxTreatment
}
export interface StayPeriod {
  id: string
  checkIn: string
  checkOut: string
}
export interface BedTaxRates {
  vat: number
  accommodation: number
  collection: number
  city: number
}
export type TransportType = 'intercity' | 'mashair'
export type TransportMode = 'bus' | 'haramain_train' | 'private_car' | 'mashair_train'
export interface PackageStay {
  periods?: StayPeriod[]
  id: string
  city: string
  hotel: string
  kind: 'primary' | 'transitional'
  checkIn: string
  checkOut: string
  contractRef: string
  notes: string
  rooms: StayRoom[]
}
export interface OccupancyOption {
  needsReview?: boolean
  id: string
  name: string
  selections: Record<string, number>
  approvedAmount: number | null
  tax: TaxTreatment
  notes: string
}
export interface CostItem {
  id: string
  name: string
  amount: number | null
  basis: 'person' | 'group'
  divisor: number | null
  optionId: string | null
  tax: TaxTreatment
}
export interface ServiceItem {
  providerId?: string
  transportType?: TransportType
  transportMode?: TransportMode
  id: string
  category: 'transportation' | 'mashair' | 'meals' | 'guidance' | 'visa' | 'additional'
  description: string
  included: boolean
}
export interface PackageEditorData {
  bedTaxes?: BedTaxRates
  category:
    | ''
    | 'economy'
    | 'standard'
    | 'premium'
    | 'luxury'
    | 'luxury_transitional'
    | 'premium_transitional'
    | 'basic'
    | 'basic_transitional'
  capacity: number | null
  stays: PackageStay[]
  options: OccupancyOption[]
  services: ServiceItem[]
  mode: PricingMode
  costs: CostItem[]
  approval: { by: string; date: string; reference: string }
  legacyPrice?: number
  needsReview: boolean
}
