import type { InternationalFlightRequest } from '../types/domain'
import { flightRequestsSchema } from '../validations/schemas'

/** Builds synthetic bookings for the first local demo session. @returns Validated independent flight records. */
export function createFlightSeed(): InternationalFlightRequest[] {
  const routes = [
    {
      country: 'Germany',
      airline: 'Emirates',
      origin: 'FRA',
      hub: 'DXB',
      destination: 'MED',
      currency: 'EUR',
      rate: 4.1,
      fare: 1220,
      tax: 180,
      seats: 35,
      prefix: 'EK'
    },
    {
      country: 'United Kingdom',
      airline: 'Saudia',
      origin: 'LHR',
      destination: 'JED',
      currency: 'GBP',
      rate: 4.8,
      fare: 1350,
      tax: 150,
      seats: 42,
      prefix: 'SV'
    },
    {
      country: 'Indonesia',
      airline: 'Garuda Indonesia',
      origin: 'CGK',
      destination: 'MED',
      currency: 'USD',
      rate: 3.75,
      fare: 1600,
      tax: 200,
      seats: 80,
      prefix: 'GA'
    },
    {
      country: 'Malaysia',
      airline: 'Qatar Airways',
      origin: 'KUL',
      hub: 'DOH',
      destination: 'JED',
      currency: 'USD',
      rate: 3.75,
      fare: 1450,
      tax: 190,
      seats: 48,
      prefix: 'QR'
    },
    {
      country: 'Turkey',
      airline: 'Turkish Airlines',
      origin: 'IST',
      destination: 'MED',
      currency: 'USD',
      rate: 3.75,
      fare: 950,
      tax: 125,
      seats: 30,
      prefix: 'TK'
    },
    {
      country: 'France',
      airline: 'Saudia',
      origin: 'CDG',
      destination: 'JED',
      currency: 'EUR',
      rate: 4.1,
      fare: 1180,
      tax: 170,
      seats: 25,
      prefix: 'SV'
    }
  ]
  return flightRequestsSchema.parse(
    routes.map((route, index) => {
      const id = `demo-flight-${index + 1}`
      const arrivalDate = `2027-05-${String(4 + index).padStart(2, '0')}`
      const departureDate = `2027-05-${String(24 + index).padStart(2, '0')}`
      const farePerPassenger = route.fare + route.tax
      const totalFare = farePerPassenger * route.seats
      const sarEquivalent = Math.round(totalFare * route.rate * 100) / 100
      const stops = route.hub
        ? [route.origin, route.hub, route.destination]
        : [route.origin, route.destination]
      const returnStops = route.hub ? ['JED', route.hub, route.origin] : ['JED', route.origin]
      return {
        id,
        recordNumber: `DEMO-${String(index + 1).padStart(3, '0')}`,
        pnr: `DEMO${index + 1}A`,
        airline: route.airline,
        country: route.country,
        arrivalDate,
        departureDate,
        arrivalRoute: stops.join(' '),
        departureRoute: returnStops.join(' '),
        currency: route.currency,
        fare: route.fare,
        otherTaxes: route.tax,
        farePerPassenger,
        passengersRequested: route.seats,
        seats: route.seats,
        totalFare,
        bookingFare: totalFare,
        exchangeRate: route.rate,
        sarEquivalent,
        totalSeatValue: sarEquivalent,
        paymentPercentage: 25,
        firstPayment: sarEquivalent * 0.25,
        segments: [stops, returnStops].flatMap((airports, direction) =>
          airports.slice(0, -1).map((from, leg) => ({
            id: `${id}-${direction}-${leg}`,
            flightNumber: `${route.prefix}${500 + index * 10 + direction * 2 + leg}`,
            travelDate: direction === 0 ? arrivalDate : departureDate,
            from,
            to: airports[leg + 1],
            departureTime: leg === 0 ? '06:00' : '13:00',
            arrivalTime: leg === 0 ? '11:00' : '16:00',
            arrivalDayOffset: 0,
            capacity: route.seats
          }))
        )
      }
    })
  )
}
