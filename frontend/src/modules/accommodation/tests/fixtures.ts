export const record = {
  id: 'housing-1',
  city: 'makkah' as const,
  name: 'Housing',
  classification: '3' as const,
  capacity: 100,
  contractPrice: 224750,
  rooms: { double: 20, triple: 30, quadruple: 40, suites: 10 },
  pricingBasis: 'bed_night' as const,
  suiteBeds: 2,
  roomRates: { double: 10, triple: 10, quadruple: 10, suites: 10 },
  unifiedNumber: '0012345678',
  contractStart: '2027-04-08',
  contractEnd: '2027-06-05',
  periods: [
    { start: '2027-04-08', end: '2027-05-01' },
    { start: '2027-05-01', end: '2027-06-05' }
  ],
  catering: false
}
