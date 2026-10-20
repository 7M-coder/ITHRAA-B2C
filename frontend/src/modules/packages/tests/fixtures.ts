import { newPackage } from '../utils/editor'
import { newStay, emptyEditor } from '../utils/finance'
import type { HajjPackage } from '../types/domain'
/** Builds a complete approved package fixture with mixed stay occupancies. @returns Package fixture. */
export function completePackage(): HajjPackage {
  const first = {
    ...newStay(),
    id: 'stay-a',
    city: 'Makkah',
    hotel: 'Hotel A',
    checkIn: '2027-05-10',
    checkOut: '2027-05-13'
  }
  first.rooms = first.rooms.map((r) => ({
    ...r,
    basis: 'room_night',
    enabled: r.occupancy === 2,
    beds: r.occupancy === 2 ? 46 : null,
    amount: r.occupancy === 2 ? 300 : null,
    tax: 'included'
  }))
  const second = {
    ...newStay(),
    id: 'stay-b',
    city: 'Madinah',
    hotel: 'Hotel B',
    checkIn: '2027-05-13',
    checkOut: '2027-05-15'
  }
  second.rooms = second.rooms.map((r) => ({
    ...r,
    amount: r.occupancy === 4 ? 200 : null,
    basis: 'bed_stay',
    tax: 'included'
  }))
  return {
    ...newPackage(),
    id: 'package-complete',
    name: 'Complete package',
    season: '1448',
    providerId: 'provider-demo-1',
    startDate: '2027-05-10',
    endDate: '2027-05-20',
    status: 'available',
    editor: {
      ...emptyEditor(),
      mode: 'approved_price',
      category: 'standard',
      capacity: 46,
      stays: [first, second],
      options: [
        {
          id: 'option-a',
          name: 'Mixed option',
          selections: { 'stay-a': 2, 'stay-b': 4 },
          approvedAmount: 1200,
          tax: 'included',
          notes: ''
        }
      ],
      approval: { by: 'Finance', date: '2027-01-01', reference: 'APP-1' }
    }
  }
}
