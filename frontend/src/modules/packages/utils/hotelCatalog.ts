import type { PackageStay } from '../types/editor'
export const demoCities = [
  { value: 'مكة المكرمة', key: 'makkah' },
  { value: 'المدينة المنورة', key: 'madinah' }
]
export const demoHotels = [
  { city: 'makkah', value: 'فندق الصفوة التجريبي', key: 'safwa' },
  { city: 'makkah', value: 'فندق الرحاب التجريبي', key: 'rehab' },
  { city: 'makkah', value: 'فندق المنار التجريبي', key: 'manar' },
  { city: 'madinah', value: 'فندق طيبة التجريبي', key: 'taiba' },
  { city: 'madinah', value: 'فندق الروضة التجريبي', key: 'rawda' },
  { city: 'madinah', value: 'فندق النور التجريبي', key: 'noor' }
]
/** Recognizes legacy and current city spellings without rewriting saved data. @param value - Stored city. @returns Catalog city key. */
export function cityKey(value: string) {
  if (['مكة المكرمة', 'مكة', 'Makkah', 'Mecca', 'makkah'].includes(value)) return 'makkah'
  if (['المدينة المنورة', 'المدينة', 'Madinah', 'Medina', 'madinah'].includes(value))
    return 'madinah'
  return undefined
}
/** Changes the city and clears a hotel belonging to the previous city. @param stay - Existing stay. @param city - Selected city. @returns Updated stay. */
export function changeStayCity(stay: PackageStay, city: string): PackageStay {
  return { ...stay, city, hotel: cityKey(stay.city) === cityKey(city) ? stay.hotel : '' }
}
/** Lists only matching city hotels, retaining a saved legacy selection for review. @param city - Stored city. @param current - Existing hotel. @returns Hotel options. */
export function cityHotels(city: string, current = '') {
  const hotels = demoHotels.filter((h) => h.city === cityKey(city))
  return current && !hotels.some((h) => h.value === current)
    ? [...hotels, { city: cityKey(city) ?? '', value: current, key: '' }]
    : hotels
}
