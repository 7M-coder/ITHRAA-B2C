import { describe, expect, it } from 'vitest'
import { connectionDefaults, journeyIssues } from '../utils/journeys'
import { flightWriteSchema } from '../validations/schemas'
describe('ordered flight journeys', () => {
  it('rejects Arabic input values but accepts English reference values', () => {
    const record = {
      id: 'r',
      pnr: 'DEMO123',
      notes: 'Demo booking',
      inbound: [{ id: 'a', city: 'Dubai', airport: 'DXB', carrier: 'Emirates' }],
      outbound: []
    }
    expect(flightWriteSchema.safeParse(record).success).toBe(true)
    expect(flightWriteSchema.safeParse({ ...record, notes: 'ملاحظات' }).success).toBe(false)
    expect(flightWriteSchema.safeParse({ ...record, pnr: 'حجز' }).success).toBe(false)
    expect(
      flightWriteSchema.safeParse({ ...record, inbound: [{ id: 'a', city: 'دبي' }] }).success
    ).toBe(false)
  })

  it('validates flight duration using airport time zones', () => {
    const inbound = [
      {
        id: 'a',
        airport: 'JED',
        destination: 'DXB',
        departureDate: '2027-05-04',
        arrivalDate: '2027-05-04',
        departureTime: '12:00',
        arrivalTime: '12:30'
      }
    ]
    expect(journeyIssues({ inbound, outbound: [] })[0].message).toBe('arrivalOrder')
    inbound[0].arrivalTime = '15:00'
    expect(journeyIssues({ inbound, outbound: [] })).toEqual([])
  })

  it('prefills a connection from the previous arrival without guessing departure time', () => {
    expect(connectionDefaults({ id: 'a', destination: 'DXB', arrivalDate: '2027-05-04' })).toEqual({
      airport: 'DXB',
      city: 'Dubai',
      departureDate: '2027-05-04'
    })
    expect(connectionDefaults()).toEqual({})
  })
  it('rejects a connection before arrival, including same-airport time conflicts', () => {
    const inbound = [
      { id: 'a', destination: 'DXB', arrivalDate: '2027-05-04', arrivalTime: '13:00' },
      { id: 'b', airport: 'DXB', departureDate: '2027-05-04', departureTime: '12:00' }
    ]
    expect(journeyIssues({ inbound, outbound: [] })[0].path).toEqual([
      'inbound',
      1,
      'departureDate'
    ])
    inbound[1].departureTime = '14:00'
    expect(journeyIssues({ inbound, outbound: [] })).toEqual([])
    inbound[1].departureDate = '2027-05-03'
    expect(
      flightWriteSchema.safeParse({ id: 'r', pnr: 'PNR', inbound, outbound: [] }).success
    ).toBe(false)
  })
  it('rejects return before the last inbound arrival and permits incomplete flights', () => {
    expect(
      journeyIssues({
        inbound: [{ id: 'a', arrivalDate: '2027-05-04' }],
        outbound: [{ id: 'b', departureDate: '2027-05-03' }]
      })[0].message
    ).toBe('returnOrder')
    expect(journeyIssues({ inbound: [{ id: 'a' }], outbound: [{ id: 'b' }] })).toEqual([])
  })
})
