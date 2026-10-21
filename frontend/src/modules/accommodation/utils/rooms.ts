import type { RoomCounts } from '../types/domain'
export const roomTypes = ['double', 'triple', 'quadruple', 'suites'] as const
/** Adds room counts, counting each suite once. @param rooms - Room inventory. @returns Total rooms. */
export function roomTotal(rooms: Partial<RoomCounts> = {}): number {
  return roomTypes.reduce((sum, key) => sum + (rooms[key] ?? 0), 0)
}
