import type { HajjPackage, PackageStatus, PilgrimType } from '../types/domain'

/** Calculates inclusive calendar days for a package period. @param startDate - Start date. @param endDate - End date. @returns Number of days or zero for invalid dates. */
export function getPackageDuration(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  return Number.isFinite(start) && Number.isFinite(end) && end >= start
    ? Math.floor((end - start) / 86_400_000) + 1
    : 0
}

/** Returns a stable ID for a local demo entity. @param prefix - Entity prefix. @returns Unique identifier. */
export function createEntityId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}

/** Checks whether an archived package can be offered to a block. @param item - Package. @returns Whether its status allows assignment. */
export function canAssignPackage(item: HajjPackage): boolean {
  return item.status === 'available'
}

/** Checks package compatibility with a block. @param item - Package. @param season - Hajj season. @param pilgrimType - Pilgrim category. @returns Whether the package matches. */
export function matchesBlock(
  item: Pick<HajjPackage, 'season' | 'pilgrimType'>,
  season: string,
  pilgrimType: PilgrimType
): boolean {
  return item.season === season && item.pilgrimType === pilgrimType
}

/** Maps package status to a translation key. @param status - Package lifecycle status. @returns Translation key suffix. */
export function packageStatusKey(status: PackageStatus): string {
  return status
}
