import type { RoomType } from '../types/editor'

/** Restores supported enabled room types from archived room records without reviving their prices. @param rooms - Historical room data. @returns Unique double, triple and quadruple choices. */
export function roomTypesFromLegacy(rooms: unknown): RoomType[] {
  if (!Array.isArray(rooms)) return []
  return ([2, 3, 4] as RoomType[]).filter((type) =>
    rooms.some(
      (room) => room && typeof room === 'object' && room.enabled === true && room.occupancy === type
    )
  )
}
