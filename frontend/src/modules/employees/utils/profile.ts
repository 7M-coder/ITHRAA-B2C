import type { TFunction } from 'i18next'
import type { Employee } from '../../core/types/domain'
/** Resolves legacy Saudi values and derives classification from a selected country. @param employee - Stored or edited record. @returns Compatible employee. */
export function normalizeEmployee(employee: Employee): Employee {
  const nationalityCode =
    employee.nationalityCode || (employee.nationality === 'Saudi' ? 'SA' : undefined)
  return {
    ...employee,
    nationalityCode,
    nationality: nationalityCode
      ? nationalityCode === 'SA'
        ? 'Saudi'
        : 'NonSaudi'
      : employee.nationality,
    otherNationality: nationalityCode === 'OTHER' ? employee.otherNationality : undefined
  }
}
/** Provides a translated nationality without guessing legacy countries. @param employee - Employee. @param t - Translator. @returns Nationality label. */
export function nationalityLabel(employee: Employee, t: TFunction): string {
  const code = employee.nationalityCode || (employee.nationality === 'Saudi' ? 'SA' : undefined)
  return code === 'OTHER'
    ? employee.otherNationality || t('countries.OTHER')
    : code
      ? t(`countries.${code}`)
      : t('unspecifiedNonSaudi')
}
