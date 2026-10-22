import { accommodationWriteSchema } from '../validations/schemas'

/** Creates clearly synthetic housing records for both supported cities. @returns Validated demo accommodation records. */
export function createDemoAccommodations() {
  return [
    {
      id: 'demo-housing-makkah-1',
      city: 'makkah',
      name: 'سكن النور — تجريبي',
      classification: '4',
      unifiedNumber: 'DEMO000001',
      capacity: 100,
      rooms: { double: 50, triple: 30, quadruple: 20, suites: 0 },
      roomRates: { double: 100, triple: 90, quadruple: 80 },
      contractPrice: 500000,
      catering: true,
      board: 'full'
    },
    {
      id: 'demo-housing-makkah-2',
      city: 'makkah',
      name: 'سكن الصفوة — تجريبي',
      classification: 'licensed',
      unifiedNumber: 'DEMO000002',
      capacity: 80,
      rooms: { double: 20, triple: 20, quadruple: 30, suites: 0 },
      roomRates: { double: 120, triple: 100, quadruple: 85 },
      contractPrice: 425000,
      catering: false
    },
    {
      id: 'demo-housing-madinah-1',
      city: 'madinah',
      name: 'سكن الطيبة — تجريبي',
      classification: '5',
      unifiedNumber: 'DEMO000003',
      capacity: 120,
      rooms: { double: 60, triple: 30, quadruple: 20, suites: 0 },
      roomRates: { double: 150, triple: 125, quadruple: 100 },
      contractPrice: 650000,
      catering: true,
      board: 'half'
    },
    {
      id: 'demo-housing-madinah-2',
      city: 'madinah',
      name: 'سكن الواحة — تجريبي',
      classification: '3',
      unifiedNumber: 'DEMO000004',
      capacity: 60,
      rooms: { double: 20, triple: 15, quadruple: 25, suites: 0 },
      roomRates: { double: 95, triple: 80, quadruple: 65 },
      contractPrice: 280000,
      catering: false
    }
  ].map((record) =>
    accommodationWriteSchema.parse({
      ...record,
      pricingBasis: 'bed_night_three',
      contractStart: '2027-04-08',
      contractEnd: '2027-06-05',
      periods: [
        { start: '2027-04-08', end: '2027-05-01' },
        { start: '2027-05-01', end: '2027-06-05' }
      ]
    })
  )
}
