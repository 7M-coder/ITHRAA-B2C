export interface FlightSegment {
  id: string
  city?: string
  airport?: string
  departureDate?: string
  departureTime?: string
  carrier?: string
  flightNumber?: string
  destination?: string
  arrivalDate?: string
  arrivalTime?: string
}
export interface InternationalFlightRequest {
  id: string
  pnr?: string
  country?: string
  notes?: string
  seats?: number
  currency?: 'SAR' | 'EUR' | 'USD'
  ticketPrice?: number
  profit?: number
  euroRate?: number
  inbound: FlightSegment[]
  outbound: FlightSegment[]
  historical?: Record<string, unknown>
}
