import type { Employee } from '../../core/types/domain'
import { payroll } from '../../core/utils/domain'
/** Escapes spreadsheet text, including formula-like and whitespace-prefixed cells. @param value - Cell text. @returns Quoted CSV cell. */
export function csvText(value: string): string {
  const safe =
    /^[=+@\-\s]/.test(value) || (value.length > 0 && value.charCodeAt(0) < 32) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}
/** Produces a UTF-8 BOM demo transfer summary. @param employees - Active employees. @param headers - Localized column titles. @returns CSV content. */
export function payrollCsv(employees: Employee[], headers: string[]): string {
  return (
    '\ufeff' +
    [
      headers.map(csvText).join(','),
      ...employees
        .filter((e) => e.employmentStatus !== 'Terminated')
        .map((e) => {
          const p = payroll(e)
          return [e.fullName, e.nationalId, e.bankIban, 'SAR']
            .map(csvText)
            .concat([p.gross, p.deductions, p.net].map((n) => `"${n.toFixed(2)}"`))
            .join(',')
        })
    ].join('\r\n')
  )
}
/** Downloads a browser-generated summary. @param csv - CSV content. @param month - Selected month. @returns Nothing. */
export function downloadPayroll(csv: string, month: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `ithraa-demo-payroll-${month}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
