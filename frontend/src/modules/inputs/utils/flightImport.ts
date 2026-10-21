import type { InternationalFlightRequest } from '../types/domain'
import { flightRequestSchema } from '../validations/schemas'

export const REQUEST_HEADERS = [
  'PNR',
  'Arrival KSA',
  'Route',
  'Departure KSA',
  'Route',
  'Currency',
  'Fare',
  'Other Taxes',
  'Fare Per Passenger',
  'Pax requested',
  'Total Fare'
] as const

export interface FlightImportResult {
  records: InternationalFlightRequest[]
  invalidRows: number[]
}

/** Converts a workbook cell to trimmed text. @param value - Cell value. @returns Text. */
function cell(value: unknown): string {
  return value === null || value === undefined
    ? ''
    : String(value)
        .trim()
        .replace(/[٠-٩۰-۹]/g, (digit) =>
          String(digit.charCodeAt(0) - (digit <= '٩' ? 0x0660 : 0x06f0))
        )
}

/** Converts Excel dates, Date cells, and ISO dates to YYYY-MM-DD. @param value - Cell value. @returns Date text. */
function date(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && value >= 30000 && value < 100000)
    return new Date(Math.round((value - 25569) * 86400000)).toISOString().slice(0, 10)
  return cell(value).slice(0, 10)
}

/** Parses an Excel amount with optional thousands separators. @param value - Cell value. @returns Numeric amount. */
function number(value: unknown): number {
  if (typeof value === 'number') return value
  const raw = cell(value).replace(/,/g, '')
  return raw && /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : Number.NaN
}

/** Identifies the same booking request across repeated imports. @param item - Flight request. @returns Composite source key. */
export function flightRequestKey(item: InternationalFlightRequest): string {
  return [item.pnr, item.arrivalDate, item.arrivalRoute, item.departureDate, item.departureRoute]
    .map((value) => value.trim().toUpperCase())
    .join('|')
}

/** Reads the Emirates booking-request layout, including blank and repeated header rows. @param rows - Parsed workbook rows. @returns Valid requests and row numbers needing review. */
export function parseFlightRows(rows: unknown[][]): FlightImportResult {
  const headerIndex = rows.findIndex((row) =>
    row.some((value) => cell(value).toLowerCase() === 'pnr')
  )
  if (headerIndex < 0) throw new Error('wrongTemplate')
  const headers = rows[headerIndex].map((value) => cell(value).toLowerCase())
  const find = (name: string) => headers.indexOf(name.toLowerCase())
  const pnr = find('PNR')
  const arrivalDate = find('Arrival KSA')
  const departureDate = find('Departure KSA')
  const currency = find('Currency')
  const routes = headers.flatMap((name, index) => (name === 'route' ? [index] : []))
  const arrivalRoute = routes.find((index) => index > arrivalDate && index < departureDate) ?? -1
  const departureRoute = routes.find((index) => index > departureDate && index < currency) ?? -1
  const columns = {
    pnr,
    arrivalDate,
    arrivalRoute,
    departureDate,
    departureRoute,
    currency,
    fare: find('Fare'),
    otherTaxes: find('Other Taxes'),
    farePerPassenger: find('Fare Per Passenger'),
    passengersRequested: find('Pax requested'),
    totalFare: find('Total Fare')
  }
  if (Object.values(columns).some((index) => index < 0)) throw new Error('wrongTemplate')
  const records: InternationalFlightRequest[] = []
  const invalidRows: number[] = []
  const seen = new Set<string>()
  rows.slice(headerIndex + 1).forEach((row, index) => {
    const values = Object.fromEntries(
      Object.entries(columns).map(([name, column]) => [name, row[column]])
    )
    if (
      Object.values(values).every((value) => !cell(value)) ||
      (cell(values.pnr).toLowerCase() === 'pnr' &&
        cell(values.arrivalDate).toLowerCase() === 'arrival ksa')
    )
      return
    const candidate = flightRequestSchema.safeParse({
      id: [
        cell(values.pnr),
        date(values.arrivalDate),
        cell(values.arrivalRoute),
        date(values.departureDate),
        cell(values.departureRoute)
      ].join('|'),
      pnr: cell(values.pnr),
      arrivalDate: date(values.arrivalDate),
      arrivalRoute: cell(values.arrivalRoute),
      departureDate: date(values.departureDate),
      departureRoute: cell(values.departureRoute),
      currency: cell(values.currency).toUpperCase(),
      fare: number(values.fare),
      otherTaxes: number(values.otherTaxes),
      farePerPassenger: number(values.farePerPassenger),
      passengersRequested: number(values.passengersRequested),
      totalFare: number(values.totalFare)
    })
    const key = candidate.success ? flightRequestKey(candidate.data) : ''
    if (!candidate.success || seen.has(key)) invalidRows.push(headerIndex + index + 2)
    else {
      seen.add(key)
      records.push(candidate.data)
    }
  })
  return { records, invalidRows }
}
