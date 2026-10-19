import type { Asset, Employee } from '../types/domain'
/** Returns a local calendar date without a timezone shift. @param date - Date to format. @returns ISO date. */
export function isoDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
/** Measures calendar days to expiry. @param date - ISO expiry. @param today - Reference date. @returns Day difference. */
export function daysUntil(date: string, today = isoDate()): number {
  return Math.round((Date.parse(date) - Date.parse(today)) / 86400000)
}
/** Calculates the specified demo payroll, independently of stored GOSI rate. @param employee - Employee. @returns Payroll values. */
export function payroll(employee: Employee) {
  const gross =
    Math.round(
      (employee.basicSalary + employee.housingAllowance + employee.transportAllowance) * 100
    ) / 100
  const deductions =
    employee.nationality === 'Saudi'
      ? Math.round((employee.basicSalary + employee.housingAllowance) * 9.75) / 100
      : 0
  return { gross, deductions, net: Math.round((gross - deductions) * 100) / 100 }
}
/** Checks custody eligibility for clearance. @param employee - Employee. @param assets - All assets. @returns Whether issuance is allowed. */
export function canClear(employee: Employee, assets: Asset[]): boolean {
  return (
    employee.employmentStatus === 'Terminated' &&
    assets.filter((a) => a.employeeId === employee.id).every((a) => a.status === 'Returned')
  )
}
/** Formats a date for the selected locale. @param date - ISO date. @param language - UI language. @returns Display date. */
export function formatDate(date: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-GB', {
    calendar: 'gregory',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${date}T12:00:00`))
}
/** Formats currency. @param value - Amount. @param language - UI language. @returns SAR amount. */
export function money(value: number, language: string): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2
  }).format(value)
}
