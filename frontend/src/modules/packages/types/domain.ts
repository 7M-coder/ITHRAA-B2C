import type { PackageEditorData } from './editor'
export type PilgrimType = 'international'
export type PackageStatus = 'draft' | 'available' | 'paused' | 'archived'
export type ProviderCategory =
  'accommodation' | 'airline' | 'transport' | 'mashair' | 'catering' | 'guidance' | 'visa' | 'other'

export interface AccommodationService {
  name: string
  city: string
  location: string
  classification: string
  nights: number | null
  checkIn: string
  checkOut: string
  amenities: string
}

export interface FlightService {
  airline: string
  origin: string
  destination: string
  departureAt: string
  arrivalAt: string
  flightNumber: string
  travelClass: string
  baggageAllowance: string
}

export interface TransportService {
  vehicleType: string
  origin: string
  destination: string
  route: string
  schedule: string
  serviceClass: string
}

export interface MashairService {
  mina: string
  arafah: string
  muzdalifah: string
  campLevel: string
  facilities: string
  transport: string
}

export interface MealsService {
  dailyMeals: number | null
  mealTypes: string
  locations: string
  includedDays: string
  dietaryOptions: string
}

export interface GuidanceService {
  religiousGuidance: string
  organizationalGuidance: string
  languages: string
  supportChannels: string
  fieldSupport: string
  healthServices: string
}

export interface VisaService {
  included: boolean
  visaType: string
  requirements: string
  responsibleParty: string
}

export interface AdditionalService {
  name: string
  description: string
  included: boolean
  extraFee: string
}

export interface PackageServices {
  accommodation?: AccommodationService[]
  flights?: FlightService[]
  transportation?: TransportService[]
  mashair?: MashairService
  meals?: MealsService
  guidance?: GuidanceService
  visa?: VisaService
  additional?: AdditionalService[]
}

export interface HajjPackage {
  editor?: PackageEditorData
  id: string
  name: string
  description: string
  descriptionDocument?: import('@tiptap/react').JSONContent
  pilgrimType: PilgrimType
  season: string
  providerId: string
  startDate: string
  endDate: string
  currency: string
  bookingPolicy: string
  cancellationPolicy: string
  bookingChannel: string
  includedServices: string[]
  excludedServices: string[]
  services: PackageServices
  status: PackageStatus
}

export interface ServiceProvider {
  id: string
  name: string
  categories: ProviderCategory[]
  active: boolean
}

export interface OperationsBlock {
  id: string
  code: string
  name: string
  season: string
  pilgrimType: PilgrimType
  packageId: string | null
}

export interface PackageDemoData {
  packages: HajjPackage[]
  providers: ServiceProvider[]
  blocks: OperationsBlock[]
}
