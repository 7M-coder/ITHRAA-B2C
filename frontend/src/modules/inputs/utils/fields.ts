export const bookingFields = ['pnr', 'country', 'seats'] as const
export const pricingFields = ['currency', 'ticketPrice', 'profit', 'euroRate'] as const
export const segmentFields = [
  'city',
  'airport',
  'departureDate',
  'departureTime',
  'carrier',
  'flightNumber',
  'destination',
  'arrivalDate',
  'arrivalTime'
] as const
export const numericFields = new Set<string>(['seats', 'ticketPrice', 'profit', 'euroRate'])
export const fieldGroups = { booking: bookingFields, pricing: pricingFields }
