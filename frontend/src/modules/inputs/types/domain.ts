export interface InternationalFlightRequest {
  id: string
  pnr: string
  arrivalDate: string
  arrivalRoute: string
  departureDate: string
  departureRoute: string
  currency: string
  fare: number
  otherTaxes: number
  farePerPassenger: number
  passengersRequested: number
  totalFare: number
}
