import type { FlightSegment } from '../types/domain'
const airportCities: Record<string, string> = {
  JED: 'Jeddah',
  MED: 'Madinah',
  DXB: 'Dubai',
  DOH: 'Doha',
  FRA: 'Frankfurt',
  LHR: 'London',
  CGK: 'Jakarta',
  KUL: 'Kuala Lumpur',
  IST: 'Istanbul',
  CDG: 'Paris'
}
/** Prefills the next departure from the prior arrival without guessing its time or carrier. @param previous - Prior flight. @returns Editable connection defaults. */
export function connectionDefaults(previous?: FlightSegment): Partial<FlightSegment> {
  return previous
    ? {
        airport: previous.destination,
        city: previous.destination ? airportCities[previous.destination] : undefined,
        departureDate: previous.arrivalDate
      }
    : {}
}
const airportZones: Record<string, string> = {
  JED: 'Asia/Riyadh',
  MED: 'Asia/Riyadh',
  DXB: 'Asia/Dubai',
  DOH: 'Asia/Qatar',
  FRA: 'Europe/Berlin',
  LHR: 'Europe/London',
  CGK: 'Asia/Jakarta',
  KUL: 'Asia/Kuala_Lumpur',
  IST: 'Europe/Istanbul',
  CDG: 'Europe/Paris'
}
/** Converts a known airport's local date/time to an instant, accounting for daylight saving. @param airport - Airport code. @param date - Local ISO date. @param time - Local clock time. @returns Milliseconds or undefined for incomplete or unknown airports. */
function instant(airport?: string, date?: string, time?: string): number | undefined {
  if (!airport || !airportZones[airport] || !date || !time) return undefined
  const local = Date.parse(`${date}T${time}:00Z`)
  if (!Number.isFinite(local)) return undefined
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: airportZones[airport],
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  })
  let result = local
  for (let index = 0; index < 3; index++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(result).map((part) => [part.type, part.value])
    )
    const represented = Date.parse(
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`
    )
    result += local - represented
  }
  return result
}
/** Finds chronological conflicts while retaining incomplete booking support. @param record - Directional flights. @returns Field paths and translated error keys. */
export function journeyIssues(record: { inbound: FlightSegment[]; outbound: FlightSegment[] }) {
  const issues: { path: (string | number)[]; message: string }[] = []
  for (const direction of ['inbound', 'outbound'] as const) {
    record[direction].forEach((leg, index) => {
      const start = instant(leg.airport, leg.departureDate, leg.departureTime)
      const end = instant(leg.destination, leg.arrivalDate, leg.arrivalTime)
      if (start !== undefined && end !== undefined && end <= start)
        issues.push({ path: [direction, index, 'arrivalTime'], message: 'arrivalOrder' })

      const previous = record[direction][index - 1]
      if (
        previous?.arrivalDate &&
        leg.departureDate &&
        (leg.departureDate < previous.arrivalDate ||
          (leg.departureDate === previous.arrivalDate &&
            previous.destination === leg.airport &&
            !!previous.arrivalTime &&
            !!leg.departureTime &&
            leg.departureTime < previous.arrivalTime))
      )
        issues.push({ path: [direction, index, 'departureDate'], message: 'connectionOrder' })
    })
  }
  const arrival = record.inbound.at(-1)
  const departure = record.outbound[0]
  if (
    arrival?.arrivalDate &&
    departure?.departureDate &&
    (departure.departureDate < arrival.arrivalDate ||
      (departure.departureDate === arrival.arrivalDate &&
        arrival.destination === departure.airport &&
        !!arrival.arrivalTime &&
        !!departure.departureTime &&
        departure.departureTime < arrival.arrivalTime))
  )
    issues.push({ path: ['outbound', 0, 'departureDate'], message: 'returnOrder' })
  return issues
}
