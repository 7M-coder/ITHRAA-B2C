import type { HajjPackage } from '../types/domain'
import type { PackageEditorData, PackageStay } from '../types/editor'
import { stayPeriods } from './periods'
import { isSeasonDate } from './dates'
import { validTransport } from './transport'
import { createEntityId } from './domain'
import {
  createDefaultServicePrices,
  OPTIONAL_SERVICE_PRICE_IDS,
  REQUIRED_SERVICE_PRICE_IDS,
  roundCurrency,
  servicePriceWithVat
} from './servicePricing'

/** Builds independent editor defaults without room or occupancy pricing. @returns Empty package editor state. */
export function emptyEditor(): PackageEditorData {
  return {
    category: '',
    capacity: null,
    stays: [],
    services: [],
    servicePrices: createDefaultServicePrices(),
    needsReview: false
  }
}

/** Returns structured editor data without mutating a package. @param item - Package. @returns Editor data. */
export function editorData(item: HajjPackage): PackageEditorData {
  return item.editor ?? emptyEditor()
}

/** Creates an empty repeatable hotel stay without room or bed data. @returns New stay. */
export function newStay(): PackageStay {
  return {
    id: createEntityId('stay'),
    city: '',
    hotel: '',
    kind: 'primary',
    checkIn: '',
    checkOut: '',
    contractRef: '',
    notes: ''
  }
}

/** Counts nights, without treating invalid dates as zero. @param start - Check-in. @param end - Check-out. @returns Nights or null. */
export function stayNights(start: string, end: string): number | null {
  const valid = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  return valid(start) && valid(end) && end > start
    ? (Date.parse(end) - Date.parse(start)) / 86400000
    : null
}

/** Adds all periods for a stay, rejecting missing, overlapping, or invalid intervals. @param stay - Stay. @returns Total nights or null. */
export function stayPeriodNights(stay: PackageStay): number | null {
  const periods = stayPeriods(stay)
  if (
    periods.some(
      (period, index) =>
        index > 0 &&
        period.checkIn &&
        periods[index - 1].checkOut &&
        period.checkIn < periods[index - 1].checkOut
    )
  )
    return null
  const values = periods.map((period) => stayNights(period.checkIn, period.checkOut))
  return values.length && values.every((value): value is number => value !== null)
    ? values.reduce((sum, value) => sum + value, 0)
    : null
}

/** Calculates each enabled service price, VAT, and service total per pilgrim. @param item - Package. @returns Service pricing lines and total. */
export function servicePricing(item: HajjPackage) {
  const editor = editorData(item)
  const validPrice = (amount: number | null) =>
    amount !== null && Number.isFinite(amount) && amount >= 0
  const lines = editor.servicePrices
    .filter((service) => service.enabled)
    .map((service) => ({
      key: service.id,
      id: service.id,
      amount: servicePriceWithVat(service.amount)
    }))
  const complete =
    REQUIRED_SERVICE_PRICE_IDS.every((id) =>
      editor.servicePrices.some(
        (service) => service.id === id && service.enabled && validPrice(service.amount)
      )
    ) &&
    OPTIONAL_SERVICE_PRICE_IDS.every((id) =>
      editor.servicePrices.every(
        (service) => service.id !== id || !service.enabled || validPrice(service.amount)
      )
    )
  const total = complete
    ? roundCurrency(lines.reduce((sum, line) => sum + (line.amount?.total ?? 0), 0))
    : null
  return { lines, complete, total }
}

/** Identifies incomplete package details and required service prices. @param item - Package. @returns Translation keys for missing sections. */
export function readiness(item: HajjPackage): string[] {
  const editor = editorData(item)
  const issues: string[] = []
  if (
    !item.name.trim() ||
    !item.season.trim() ||
    !editor.category ||
    !editor.capacity ||
    !item.startDate ||
    !item.endDate ||
    item.endDate < item.startDate ||
    !isSeasonDate(item.startDate) ||
    !isSeasonDate(item.endDate)
  )
    issues.push('general')
  if (
    !editor.stays.length ||
    editor.stays.some(
      (stay) =>
        !stay.hotel.trim() ||
        !stay.city.trim() ||
        stayPeriodNights(stay) === null ||
        stayPeriods(stay).some(
          (period) =>
            period.checkIn < item.startDate ||
            period.checkOut > item.endDate ||
            !isSeasonDate(period.checkIn) ||
            !isSeasonDate(period.checkOut)
        )
    )
  )
    issues.push('stays')
  if (
    REQUIRED_SERVICE_PRICE_IDS.some(
      (id) => !editor.servicePrices.some((service) => service.id === id && service.amount !== null)
    ) ||
    editor.servicePrices.some(
      (service) =>
        OPTIONAL_SERVICE_PRICE_IDS.includes(service.id) &&
        service.enabled &&
        service.amount === null
    )
  )
    issues.push('servicePrices')
  if (!servicePricing(item).complete) issues.push('prices')
  if (
    editor.services.some(
      (service) =>
        service.category === 'transportation' &&
        (!service.description.trim() ||
          !validTransport(service.transportType, service.transportMode))
    )
  )
    issues.push('services')
  if (editor.needsReview) issues.push('legacyReview')
  return issues
}

/** Reports overlapping stays and program dates outside the season. @param item - Package. @returns Warning types. */
export function packageWarnings(item: HajjPackage): string[] {
  const editor = editorData(item)
  const warnings: string[] = []
  if (
    !isSeasonDate(item.startDate) ||
    !isSeasonDate(item.endDate) ||
    editor.stays.some((stay) =>
      stayPeriods(stay).some(
        (period) => !isSeasonDate(period.checkIn) || !isSeasonDate(period.checkOut)
      )
    )
  )
    warnings.push('seasonRange')
  if (
    editor.stays.some((stay, index) =>
      editor.stays
        .slice(index + 1)
        .some((other) =>
          stayPeriods(stay).some((period) =>
            stayPeriods(other).some(
              (otherPeriod) =>
                period.checkIn &&
                otherPeriod.checkIn &&
                period.checkIn < otherPeriod.checkOut &&
                otherPeriod.checkIn < period.checkOut
            )
          )
        )
    )
  )
    warnings.push('overlap')
  return warnings
}

/** Removes a hotel stay without modifying other package details. @param item - Package. @param id - Stay ID. @returns Updated package. */
export function removeStay(item: HajjPackage, id: string): HajjPackage {
  const editor = editorData(item)
  return { ...item, editor: { ...editor, stays: editor.stays.filter((stay) => stay.id !== id) } }
}

/** Formats the calculated per-pilgrim service total. @param item - Package. @param t - Translator. @returns Human-readable summary. */
export function financialSummary(item: HajjPackage, t: (key: string) => string): string {
  const total = servicePricing(item).total
  if (total === null) return t('editor.incomplete')
  return `${t('editor.packageTotal')}: ${total.toFixed(2)} ${item.currency === 'SAR' ? t('editor.riyal') : item.currency}`
}
