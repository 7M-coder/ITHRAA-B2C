import type { HajjPackage } from '../types/domain'
import type { PackageEditorData, OccupancyOption, PackageStay, TaxTreatment } from '../types/editor'
import { stayPeriods } from './periods'
import { isSeasonDate } from './dates'
import { bedPrice, BED_TAX_RATES } from './bedPricing'
import { validTransport } from './transport'
import { createEntityId } from './domain'
/** Builds independent editor defaults. @returns Empty package editor state. */
export function emptyEditor(): PackageEditorData {
  return {
    bedTaxes: { ...BED_TAX_RATES },
    category: '',
    capacity: null,
    stays: [],
    options: [],
    services: [],
    mode: 'cost_draft',
    costs: [],
    approval: { by: '', date: '', reference: '' },
    needsReview: false
  }
}
/** Returns structured editor data without mutating a package. @param item - Package. @returns Editor data. */
export function editorData(item: HajjPackage): PackageEditorData {
  return item.editor ?? emptyEditor()
}
/** Creates an empty repeatable stay with stable identity. @returns New stay. */
export function newStay(): PackageStay {
  return {
    id: createEntityId('stay'),
    city: '',
    hotel: '',
    kind: 'primary',
    checkIn: '',
    checkOut: '',
    contractRef: '',
    notes: '',
    rooms: [1, 2, 3, 4].map((occupancy) => ({
      occupancy,
      enabled: occupancy === 4,
      beds: null,
      amount: null,
      basis: 'bed_night',
      tax: 'excluded'
    }))
  }
}
/** Counts nights, without treating invalid dates as zero cost. @param start - Check-in. @param end - Check-out. @returns Nights or null. */
export function stayNights(start: string, end: string): number | null {
  const valid = (v: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v
  return valid(start) && valid(end) && end > start
    ? (Date.parse(end) - Date.parse(start)) / 86400000
    : null
}
/** Adds all periods for the same stay without treating incomplete intervals as zero nights. @param stay - Stay. @returns Total nights or null. */
export function stayPeriodNights(stay: PackageStay): number | null {
  const periods = stayPeriods(stay)
  if (
    periods.some(
      (p, i) => i > 0 && p.checkIn && periods[i - 1].checkOut && p.checkIn < periods[i - 1].checkOut
    )
  )
    return null
  const values = periods.map((p) => stayNights(p.checkIn, p.checkOut))
  return values.length && values.every((n): n is number => n !== null)
    ? values.reduce((sum, n) => sum + n, 0)
    : null
}
/** Identifies missing approved-price prerequisites. @param item - Package. @returns Translation keys for missing sections. */
export function readiness(item: HajjPackage): string[] {
  const e = editorData(item)
  const issues: string[] = []
  if (
    !item.name.trim() ||
    !item.season.trim() ||
    !e.category ||
    !e.capacity ||
    !item.startDate ||
    !item.endDate ||
    item.endDate < item.startDate ||
    !isSeasonDate(item.startDate) ||
    !isSeasonDate(item.endDate)
  )
    issues.push('general')
  if (
    !e.stays.length ||
    e.stays.some(
      (s) =>
        !s.hotel.trim() ||
        !s.city.trim() ||
        stayPeriodNights(s) === null ||
        stayPeriods(s).some(
          (p) =>
            p.checkIn < item.startDate ||
            p.checkOut > item.endDate ||
            !isSeasonDate(p.checkIn) ||
            !isSeasonDate(p.checkOut)
        ) ||
        !s.rooms.some((r) => r.enabled)
    )
  )
    issues.push('stays')
  if (
    !e.options.length ||
    e.options.some(
      (o) =>
        o.needsReview ||
        !o.name.trim() ||
        !e.stays.length ||
        e.stays.some((s) => !s.rooms.some((r) => r.enabled && r.occupancy === o.selections[s.id]))
    )
  )
    issues.push('options')
  if (e.mode !== 'approved_price') issues.push('costOnly')
  if (
    e.mode === 'approved_price' &&
    e.options.some((o) => o.approvedAmount === null || o.tax === 'unknown')
  )
    issues.push('prices')
  if (e.mode === 'approved_price' && (!e.approval.by.trim() || !e.approval.date))
    issues.push('approval')
  if (
    e.services.some(
      (s) =>
        s.category === 'transportation' &&
        (!s.description.trim() || !validTransport(s.transportType, s.transportMode))
    )
  )
    issues.push('services')
  if (e.needsReview) issues.push('legacyReview')
  return issues
}
export interface CostLine {
  key: string
  name: string
  amount: number | null
  tax: TaxTreatment
  base?: number | null
  additions?: number | null
}
/** Computes per-person costs, including additive lodging charges for bed-night inputs; never adds profit. @param item - Package. @param option - Selected occupancy combination. @returns Raw cost lines and rounded complete total. */
export function optionCost(item: HajjPackage, option: OccupancyOption) {
  const e = editorData(item)
  const lines: CostLine[] = e.stays.map((s) => {
    const room = s.rooms.find((r) => r.enabled && r.occupancy === option.selections[s.id])
    const nights = stayPeriodNights(s)
    const base =
      room?.amount !== null && room?.amount !== undefined && nights !== null
        ? room.amount * nights
        : null
    const priced =
      room?.basis === 'bed_night' && room.tax === 'excluded' ? bedPrice(base, e.bedTaxes) : null
    return {
      key: s.id,
      name: s.hotel || s.city,
      amount:
        !room ||
        room.amount === null ||
        !Number.isFinite(room.amount) ||
        room.amount < 0 ||
        nights === null
          ? null
          : room.basis === 'bed_night'
            ? room.tax === 'unknown'
              ? null
              : room.tax === 'included'
                ? base
                : (priced?.total ?? null)
            : room.basis === 'bed_stay'
              ? room.amount
              : (room.amount * nights) / room.occupancy,
      base: room?.basis === 'bed_night' ? base : undefined,
      additions: priced ? priced.total - priced.base : undefined,
      tax:
        room?.basis === 'bed_night' && room.tax !== 'unknown'
          ? 'included'
          : (room?.tax ?? 'unknown')
    }
  })
  for (const c of e.costs.filter((c) => !c.optionId || c.optionId === option.id))
    lines.push({
      key: c.id,
      name: c.name,
      amount:
        c.amount === null ||
        !Number.isFinite(c.amount) ||
        c.amount < 0 ||
        !c.name.trim() ||
        (c.basis === 'group' && (!c.divisor || !Number.isInteger(c.divisor) || c.divisor <= 0))
          ? null
          : c.basis === 'group'
            ? c.amount / c.divisor!
            : c.amount,
      tax: c.tax
    })
  const complete =
    !option.needsReview &&
    e.stays.length > 0 &&
    lines.every((l) => l.amount !== null) &&
    e.stays.every((s) => s.rooms.some((r) => r.enabled && r.occupancy === option.selections[s.id]))
  return {
    lines,
    complete,
    total: complete
      ? Math.round((lines.reduce((sum, l) => sum + (l.amount ?? 0), 0) + Number.EPSILON) * 100) /
        100
      : null,
    taxComplete: lines.every((l) => l.tax === 'included')
  }
}
/** Reports overlapping stays and provisional bed-allocation mismatches. @param item - Package. @returns Warning types. */
export function packageWarnings(item: HajjPackage): string[] {
  const e = editorData(item)
  const warnings: string[] = []
  if (
    !isSeasonDate(item.startDate) ||
    !isSeasonDate(item.endDate) ||
    e.stays.some((s) =>
      stayPeriods(s).some((p) => !isSeasonDate(p.checkIn) || !isSeasonDate(p.checkOut))
    )
  )
    warnings.push('seasonRange')
  if (
    e.stays.some((s, i) =>
      e.stays
        .slice(i + 1)
        .some((o) =>
          stayPeriods(s).some((a) =>
            stayPeriods(o).some(
              (b) => a.checkIn && b.checkIn && a.checkIn < b.checkOut && b.checkIn < a.checkOut
            )
          )
        )
    )
  )
    warnings.push('overlap')
  if (
    e.capacity !== null &&
    e.stays.some(
      (s) =>
        s.rooms.some((r) => r.enabled && r.beds !== null) &&
        s.rooms.filter((r) => r.enabled).reduce((n, r) => n + (r.beds ?? 0), 0) !== e.capacity
    )
  )
    warnings.push('beds')
  return warnings
}
/** Removes a stay and its option selections without changing other identities. @param item - Package. @param id - Stay ID. @returns Updated package. */
export function removeStay(item: HajjPackage, id: string): HajjPackage {
  const e = editorData(item)
  return {
    ...item,
    editor: {
      ...e,
      stays: e.stays.filter((s) => s.id !== id),
      options: e.options.map((o) => ({
        ...o,
        needsReview: o.needsReview || id in o.selections,
        selections: Object.fromEntries(Object.entries(o.selections).filter(([key]) => key !== id))
      }))
    }
  }
}
/** Formats approved prices or estimated costs distinctly. @param item - Package. @param t - Translator. @returns Human-readable summary. */
export function financialSummary(item: HajjPackage, t: (key: string) => string): string {
  const e = editorData(item)
  if (!e.options.length || (e.mode === 'approved_price' && readiness(item).length > 0))
    return t('editor.incomplete')
  const values = e.options.map((o) =>
    e.mode === 'cost_draft' ? optionCost(item, o).total : o.approvedAmount
  )
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length !== values.length) return t('editor.incomplete')
  const lo = Math.min(...valid),
    hi = Math.max(...valid)
  return `${t(e.mode === 'cost_draft' ? 'editor.estimatedCost' : 'editor.approvedPrice')}: ${lo.toFixed(2)}${hi !== lo ? ` – ${hi.toFixed(2)}` : ''} ${item.currency === 'SAR' ? t('editor.riyal') : item.currency}`
}
