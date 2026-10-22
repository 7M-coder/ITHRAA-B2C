export interface FlightSegment {
  id: string
  flightNumber?: string
  travelDate?: string
  departureDateH?: string
  from?: string
  to?: string
  departureTime?: string
  arrivalTime?: string
  arrivalDayOffset?: number
  capacity?: number
}

export interface InternationalFlightRequest {
  id: string
  recordNumber?: string
  airline?: string
  pnr?: string
  country?: string
  notes?: string
  arrivalDate?: string
  arrivalRoute?: string
  departureDate?: string
  departureRoute?: string
  currency?: string
  fare?: number
  otherTaxes?: number
  farePerPassenger?: number
  passengersRequested?: number
  totalFare?: number
  seats?: number
  issuedNames?: string
  bookingFare?: number
  exchangeRate?: number
  sarEquivalent?: number
  totalSeatValue?: number
  paymentPercentage?: number
  firstPayment?: number
  segments: FlightSegment[]
}
