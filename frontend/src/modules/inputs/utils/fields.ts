export const bookingFields = ['recordNumber', 'airline', 'pnr', 'country', 'notes'] as const
export const travelFields = [
  'arrivalDate',
  'arrivalRoute',
  'departureDate',
  'departureRoute'
] as const
export const passengerFields = ['seats', 'passengersRequested', 'issuedNames'] as const
export const pricingFields = [
  'currency',
  'fare',
  'otherTaxes',
  'farePerPassenger',
  'bookingFare',
  'totalFare'
] as const
export const conversionFields = ['exchangeRate', 'sarEquivalent'] as const
export const paymentFields = ['totalSeatValue', 'paymentPercentage', 'firstPayment'] as const
export const segmentFields = [
  'flightNumber',
  'travelDate',
  'departureDateH',
  'from',
  'to',
  'departureTime',
  'arrivalTime',
  'arrivalDayOffset',
  'capacity'
] as const
export const fieldGroups = {
  booking: bookingFields,
  travel: travelFields,
  passengers: passengerFields,
  pricing: pricingFields,
  conversion: conversionFields,
  payment: paymentFields
}
export const numericFields = new Set<string>([
  'seats',
  'passengersRequested',
  'fare',
  'otherTaxes',
  'farePerPassenger',
  'bookingFare',
  'totalFare',
  'exchangeRate',
  'sarEquivalent',
  'totalSeatValue',
  'paymentPercentage',
  'firstPayment',
  'arrivalDayOffset',
  'capacity'
])
export const countFields = new Set<string>([
  'seats',
  'passengersRequested',
  'arrivalDayOffset',
  'capacity'
])
