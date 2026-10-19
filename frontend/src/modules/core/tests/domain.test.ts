import { describe, expect, it } from 'vitest'
import { seedData } from '../utils/seed'
import { canClear, daysUntil, payroll } from '../utils/domain'
import { employeeSchema } from '../validations/schemas'
import { csvText, payrollCsv } from '../../payroll/utils/csv'
const employee = seedData().employees[0]
describe('employee validation', () => {
  it('normalizes names and IBAN without losing ID leading digits', () => {
    const parsed = employeeSchema.parse({
      ...employee,
      fullName: '  Demo Name  ',
      bankIban: employee.bankIban.toLowerCase()
    })
    expect(parsed.fullName).toBe('Demo Name')
    expect(parsed.bankIban).toBe(employee.bankIban)
  })
  it.each([
    { fullName: ' ' },
    { nationalId: '123' },
    { nationalId: '2000000001' },
    { bankIban: 'SA123' },
    { idExpiryDate: '2026-02-30' },
    { basicSalary: -1 },
    { housingAllowance: -1 },
    { transportAllowance: -1 },
    { gosiRate: 101 },
    { jobTitle: '<script>' }
  ])('rejects invalid fields %j', (invalid) => {
    expect(employeeSchema.safeParse({ ...employee, ...invalid }).success).toBe(false)
  })
})
describe('demo business rules', () => {
  it('uses fixed 9.75% of basic + housing, ignoring the stored GOSI rate', () => {
    expect(
      payroll({
        ...employee,
        basicSalary: 10000,
        housingAllowance: 2000,
        transportAllowance: 500,
        gosiRate: 1
      })
    ).toEqual({ gross: 12500, deductions: 1170, net: 11330 })
    expect(payroll({ ...employee, nationality: 'NonSaudi', gosiRate: 100 }).deductions).toBe(0)
  })
  it('handles expiry boundaries as calendar dates', () => {
    expect(daysUntil('2026-10-18', '2026-10-19')).toBe(-1)
    expect(daysUntil('2026-10-19', '2026-10-19')).toBe(0)
    expect(daysUntil('2026-11-18', '2026-10-19')).toBe(30)
    expect(daysUntil('2026-11-19', '2026-10-19')).toBe(31)
  })
  it('allows no custody and returned custody, but rejects active and lost custody', () => {
    const terminated = {
      ...employee,
      employmentStatus: 'Terminated' as const,
      uncompensatedLeaveDays: 12
    }
    const asset = { ...seedData().assets[0], employeeId: employee.id }
    expect(canClear(terminated, [])).toBe(true)
    expect(canClear(terminated, [{ ...asset, status: 'Returned' }])).toBe(true)
    expect(canClear(terminated, [{ ...asset, status: 'Active' }])).toBe(false)
    expect(canClear(terminated, [{ ...asset, status: 'Lost' }])).toBe(false)
    expect(canClear(employee, [])).toBe(false)
  })
})
describe('CSV export', () => {
  it.each(['=SUM(1)', '+123', '-1', '@cmd', ' spaced', '\tcommand', '\ncommand', '\u0001test'])(
    'neutralizes spreadsheet formula prefixes %s',
    (value) => {
      expect(csvText(value).startsWith('"\'')).toBe(true)
    }
  )
  it('preserves Arabic, BOM, quotes, seven columns, and excludes terminated employees', () => {
    const csv = payrollCsv(
      [
        { ...employee, fullName: 'اسم "تجريبي"' },
        { ...employee, id: 'terminated', employmentStatus: 'Terminated' }
      ],
      ['name', 'id', 'iban', 'currency', 'gross', 'deductions', 'net']
    )
    expect(csv.startsWith('\ufeff')).toBe(true)
    expect(csv.split('\r\n')).toHaveLength(2)
    expect(csv).toContain('"اسم ""تجريبي"""')
    expect(csv).toContain('"SAR"')
    expect(csv).toContain('"14500.00","1365.00","13135.00"')
  })
})
