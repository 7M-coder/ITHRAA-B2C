import type { RoomCounts } from '../types/domain'
export const roomTypes = ['double', 'triple', 'quadruple', 'suites'] as const
export const pricedRoomTypes = ['double', 'triple', 'quadruple'] as const
export const bedsPerRoom = { double: 2, triple: 3, quadruple: 4 } as const
/** Adds room counts, for double, triple and quadruple types. @param rooms - Room inventory. @returns Total rooms. */
export function roomTotal(rooms: Partial<RoomCounts> = {}): number {
  return pricedRoomTypes.reduce((sum, key) => sum + (rooms[key] ?? 0), 0)
}
