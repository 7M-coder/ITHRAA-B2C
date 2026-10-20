export interface StayPeriod {
  id: string
  checkIn: string
  checkOut: string
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
}
export type ServicePriceId =
  | 'intercityBus'
  | 'intercityTrain'
  | 'makkahMashairBus'
  | 'mashairTrain'
  | 'prayerBus'
  | 'enrichmentVisitsBus'
  | 'meals'
  | 'baggageHandling'
  | 'giftPackage'
  | 'simCard'
  | 'wheelchairCompanion'
  | 'zamzam'
  | 'operatingFees'
export interface ServicePrice {
  id: ServicePriceId
  amount: number | null
  enabled: boolean
}
export interface ServiceItem {
  transportType?: TransportType
  transportMode?: TransportMode
  id: string
  category: 'transportation' | 'mashair' | 'meals' | 'guidance' | 'visa' | 'additional'
  description: string
  included: boolean
}
export interface PackageEditorData {
  category: '' | 'economy' | 'standard' | 'premium' | 'luxury'
  capacity: number | null
  stays: PackageStay[]
  services: ServiceItem[]
  servicePrices: ServicePrice[]
  needsReview: boolean
}
