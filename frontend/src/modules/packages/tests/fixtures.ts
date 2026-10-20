import { newPackage } from '../utils/editor'
import { newStay, emptyEditor } from '../utils/finance'
import type { HajjPackage } from '../types/domain'
/** Builds a complete package fixture with hotel stays and service prices. @returns Package fixture. */
export function completePackage(): HajjPackage {
  const first = {
    ...newStay(),
    id: 'stay-a',
    city: 'Makkah',
    hotel: 'Hotel A',
    checkIn: '2027-05-10',
    checkOut: '2027-05-13'
  }
  const second = {
    ...newStay(),
    id: 'stay-b',
    city: 'Madinah',
    hotel: 'Hotel B',
    checkIn: '2027-05-13',
    checkOut: '2027-05-15'
  }
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
      category: 'standard',
      capacity: 46,
      stays: [first, second],
      servicePrices: emptyEditor().servicePrices.map((service) => ({
        ...service,
        amount: service.enabled ? 100 : null
      })),
      services: []
    }
  }
}
