export const record = {
  id: 'housing-1',
  city: 'makkah' as const,
  name: 'Housing',
  classification: '3' as const,
  capacity: 100,
  contractPrice: 125000.5,
  rooms: { double: 20, triple: 30, quadruple: 40, suites: 10 },
  unifiedNumber: '001234',
  contractStart: '2027-04-08',
  contractEnd: '2027-06-05',
  periods: [
    { start: '2027-04-08', end: '2027-05-01' },
    { start: '2027-05-01', end: '2027-06-05' }
  ],
  catering: false
}
