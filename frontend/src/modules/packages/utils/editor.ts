import type { HajjPackage } from '../types/domain'
import { emptyEditor } from './finance'
import { createEntityId } from './domain'
export const PACKAGE_SEASON = '1448'
export const PACKAGE_CURRENCY = 'SAR'
/** Creates a new independent local package draft. @returns Blank draft. */
export function newPackage(): HajjPackage {
  return {
    id: createEntityId('package'),
    name: '',
    description: '',
    pilgrimType: 'international',
    season: PACKAGE_SEASON,
    providerId: '',
    startDate: '',
    endDate: '',
    price: 0,
    currency: PACKAGE_CURRENCY,
    bookingPolicy: '',
    cancellationPolicy: '',
    bookingChannel: '',
    includedServices: [],
    excludedServices: [],
    services: {},
    status: 'draft',
    editor: emptyEditor()
  }
}
