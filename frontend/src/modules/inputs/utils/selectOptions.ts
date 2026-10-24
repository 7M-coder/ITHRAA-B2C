import englishInputs from '../../../../public/locales/en/inputs.json'

/** Synthetic selectable flight references; stored values remain language-independent. */
export const flightSelectOptions: Record<string, readonly string[]> = {
  country: [
    'Saudi Arabia',
    'Germany',
    'United Kingdom',
    'Indonesia',
    'Malaysia',
    'Turkey',
    'France'
  ],
  city: [
    'Jeddah',
    'Madinah',
    'Dubai',
    'Doha',
    'Frankfurt',
    'London',
    'Jakarta',
    'Kuala Lumpur',
    'Istanbul',
    'Paris'
  ],
  airport: ['JED', 'MED', 'DXB', 'DOH', 'FRA', 'LHR', 'CGK', 'KUL', 'IST', 'CDG'],
  carrier: ['Saudia', 'Emirates', 'Qatar Airways', 'Garuda Indonesia', 'Turkish Airlines']
}
flightSelectOptions.destination = flightSelectOptions.airport

/** Formats stored reference values consistently in forms and tables. @param field - Reference field. @param value - Stored identifier. @returns English reference label, retaining unknown historical values. */
export function flightReferenceLabel(field: string, value: string): string {
  const group = field === 'destination' ? 'airport' : field
  if (!flightSelectOptions[field]) return value
  const references = englishInputs.selectData as Record<string, Record<string, string>>
  const label = references[group]?.[value] ?? value
  return group === 'airport' && label !== value ? `${label} (${value})` : label
}
