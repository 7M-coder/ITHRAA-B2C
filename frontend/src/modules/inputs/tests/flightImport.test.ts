import { describe, expect, it } from 'vitest'
import { parseFlightRows, REQUEST_HEADERS } from '../utils/flightImport'

const request = [
  'DIBXE2',
  45792,
  'FRA DXB MED',
  45814,
  'JED DXB FRA',
  'EUR',
  1220,
  186.34,
  '1,406',
  35,
  '49,221.90'
]

describe('flight booking request import', () => {
  it('reads Excel date serials and keeps source fare values distinct', () => {
    const result = parseFlightRows([[], [null, ...REQUEST_HEADERS], [null, ...request]])
    expect(result.invalidRows).toEqual([])
    expect(result.records[0]).toMatchObject({
      pnr: 'DIBXE2',
      arrivalDate: '2025-05-15',
      departureDate: '2025-06-06',
      arrivalRoute: 'FRA DXB MED',
      departureRoute: 'JED DXB FRA',
      fare: 1220,
      otherTaxes: 186.34,
      farePerPassenger: 1406,
      passengersRequested: 35,
      totalFare: 49221.9
    })
  })

  it('skips blank and repeated headers and reports duplicate or invalid rows', () => {
    const result = parseFlightRows([
      [],
      [null, ...REQUEST_HEADERS],
      [null, ...request],
      [null, ...REQUEST_HEADERS],
      [null, ...request],
      [null, ...request.slice(0, 9), 0, '49,221.90']
    ])
    expect(result.records).toHaveLength(1)
    expect(result.invalidRows).toEqual([5, 6])
  })

  it('rejects the old per-pilgrim flight layout', () => {
    expect(() => parseFlightRows([['BookingId', 'ApplicantId']])).toThrow('wrongTemplate')
    expect(() => parseFlightRows([['PNR']])).toThrow('wrongTemplate')
  })

  it('ignores an extra column between required columns and rejects a missing one', () => {
    const headers: string[] = [...REQUEST_HEADERS]
    const values = [...request]
    headers.splice(3, 0, 'Notes')
    values.splice(3, 0, 'Example note')
    expect(
      parseFlightRows([
        [null, ...headers],
        [null, ...values]
      ]).records
    ).toHaveLength(1)
    headers.splice(headers.indexOf('Currency'), 1)
    expect(() =>
      parseFlightRows([
        [null, ...headers],
        [null, ...values]
      ])
    ).toThrow('wrongTemplate')
  })

  it('normalizes Arabic and Persian digits in imported numeric cells', () => {
    const values = [...request]
    values[6] = '١٢٢٠'
    values[9] = '۳۵'
    const result = parseFlightRows([
      [null, ...REQUEST_HEADERS],
      [null, ...values]
    ])
    expect(result.records[0]).toMatchObject({ fare: 1220, passengersRequested: 35 })
  })
})
