import { expect, it } from 'vitest'
import { cityHotels, changeStayCity, cityKey } from '../utils/hotelCatalog'
import { newStay } from '../utils/finance'
import { shiftDate, earliestDate, latestDate } from '../utils/dates'
it('filters hotels by city and clears a hotel when switching cities', () => {
  expect(cityHotels('مكة المكرمة')).toHaveLength(3)
  expect(cityHotels('مكة المكرمة').every((h) => h.city === 'makkah')).toBe(true)
  expect(cityHotels('المدينة المنورة').every((h) => h.city === 'madinah')).toBe(true)
  expect(cityHotels('')).toEqual([])
  const stay = { ...newStay(), city: 'مكة المكرمة', hotel: 'فندق الصفوة التجريبي' }
  expect(changeStayCity(stay, 'المدينة المنورة')).toMatchObject({
    id: stay.id,
    city: 'المدينة المنورة',
    hotel: ''
  })
  expect(changeStayCity(stay, 'Makkah').hotel).toBe(stay.hotel)
  expect(cityKey('Madinah')).toBe('madinah')
})
it('retains saved hotel names for review rather than replacing user data with demo hotels', () => {
  expect(cityHotels('Makkah', 'Saved hotel')).toContainEqual({
    city: 'makkah',
    value: 'Saved hotel',
    key: ''
  })
})
it('combines stay and program bounds and requires checkout at least one day after check-in', () => {
  expect(shiftDate('2027-05-10', 1)).toBe('2027-05-11')
  expect(shiftDate('', 1)).toBeUndefined()
  expect(earliestDate('2027-05-20', shiftDate('2027-05-15', -1))).toBe('2027-05-14')
  expect(latestDate(undefined, shiftDate('2027-05-10', 1))).toBe('2027-05-11')
})
