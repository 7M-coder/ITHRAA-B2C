import type { TransportType, TransportMode } from '../types/editor'
export const transportModes: Record<TransportType, TransportMode[]> = {
  intercity: ['bus', 'haramain_train', 'private_car'],
  mashair: ['bus', 'mashair_train']
}
/** Validates a transport subtype and its permitted mode. @param type - Route type. @param mode - Vehicle mode. @returns Whether the combination is allowed. */
export function validTransport(type: TransportType | undefined, mode: TransportMode | undefined) {
  return !!type && !!mode && transportModes[type].includes(mode)
}
