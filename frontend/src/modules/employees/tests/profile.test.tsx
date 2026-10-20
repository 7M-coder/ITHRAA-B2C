import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'
import ThemeProvider from '@/context/ThemeProvider'
import { seedData } from '@/modules/core/utils/seed'
import { payroll } from '@/modules/core/utils/domain'
import { employeeCreateSchema, employeeSchema } from '@/modules/core/validations/schemas'
import { useDemoStore } from '@/modules/core/hooks/useDemoStore'
import EmployeesPage from '../pages/EmployeesPage'
import { normalizeEmployee } from '../utils/profile'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useDemoStore.setState(seedData())
})
const first = seedData().employees[0]
describe('profile validation', () => {
  it('normalizes local and international Saudi mobile formats', () => {
    expect(employeeSchema.parse({ ...first, phone: '0501234567' }).phone).toBe('+966501234567')
    expect(employeeSchema.parse({ ...first, phone: '+966501234567' }).phone).toBe('+966501234567')
  })
  it.each([
    { phone: '1234' },
    { email: 'not-an-email' },
    { startDate: '2026-02-30' },
    { department: '<script>' },
    {
      nationalityCode: 'OTHER',
      nationality: 'NonSaudi',
      nationalId: '2000000001',
      otherNationality: ''
    }
  ])('rejects invalid profile fields %j', (invalid) => {
    expect(employeeSchema.safeParse({ ...first, ...invalid }).success).toBe(false)
  })
  it('requires department, start date and country only for new records', () => {
    const legacy = {
      ...first,
      nationalityCode: undefined,
      phone: undefined,
      email: undefined,
      department: undefined,
      startDate: undefined
    }
    expect(employeeSchema.safeParse(legacy).success).toBe(true)
    expect(employeeCreateSchema.safeParse(legacy).success).toBe(false)
  })
  it('derives classification without changing payroll for the same nationality', () => {
    const egyptian = normalizeEmployee({
      ...first,
      nationalId: '2000000001',
      nationalityCode: 'EG'
    })
    expect(egyptian.nationality).toBe('NonSaudi')
    expect(payroll(egyptian).deductions).toBe(0)
    expect(payroll(normalizeEmployee(first))).toEqual(payroll(first))
  })
})
describe('employee profile interaction', () => {
  it('opens the correct profile, saves live edits, and preserves search on close', async () => {
    render(
      <ThemeProvider>
        <EmployeesPage />
      </ThemeProvider>
    )
    const search = screen.getByRole('textbox', { name: /Search name/ })
    fireEvent.change(search, { target: { value: first.fullName } })
    await userEvent.click(
      screen.getByRole('button', { name: `View profile for ${first.fullName}` })
    )
    const drawer = await screen.findByRole('dialog', { name: 'Employee profile' })
    expect(within(drawer).getByText(first.email!)).toBeInTheDocument()
    fireEvent.click(within(drawer).getByRole('button', { name: /Edit/ }))
    // Ant Design's test-mode useId reuses title IDs across Drawer and Modal.
    const modal = screen
      .getAllByRole('dialog')
      .find((el) => within(el).queryByText('Edit employee'))!
    fireEvent.change(within(modal).getByLabelText('Department'), {
      target: { value: 'Updated department' }
    })
    await userEvent.click(within(modal).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(within(drawer).getByText('Updated department')).toBeInTheDocument())
    expect(localStorage.getItem('ithraa-hr-demo-v1')).toContain('Updated department')
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close' }))
    expect(search).toHaveValue(first.fullName)
  }, 15000)
  it('displays missing legacy data without inventing a nationality', async () => {
    const e = {
      ...seedData().employees[2],
      nationalityCode: undefined,
      phone: undefined,
      email: undefined,
      department: undefined,
      startDate: undefined
    }
    useDemoStore.setState({ employees: [e] })
    render(
      <ThemeProvider>
        <EmployeesPage />
      </ThemeProvider>
    )
    await userEvent.click(screen.getByRole('button', { name: `View profile for ${e.fullName}` }))
    const drawer = await screen.findByRole('dialog', { name: 'Employee profile' })
    expect(within(drawer).getByText('Unspecified — non-Saudi')).toBeInTheDocument()
    expect(within(drawer).getAllByText('Not recorded')).toHaveLength(4)
  })
  it('searches by actual nationality', () => {
    render(
      <ThemeProvider>
        <EmployeesPage />
      </ThemeProvider>
    )
    fireEvent.change(screen.getByRole('textbox', { name: /Search name/ }), {
      target: { value: 'Egypt' }
    })
    expect(screen.getByRole('button', { name: /View profile for محمد/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: `View profile for ${first.fullName}` })
    ).not.toBeInTheDocument()
  })
  it('opens in Arabic with translated fields', async () => {
    await i18n.changeLanguage('ar')
    render(
      <ThemeProvider>
        <EmployeesPage />
      </ThemeProvider>
    )
    await userEvent.click(screen.getByRole('button', { name: `عرض ملف ${first.fullName}` }))
    const drawer = await screen.findByRole('dialog', { name: 'ملف الموظف' })
    expect(within(drawer).getByText('رقم الجوال')).toBeInTheDocument()
    expect(within(drawer).getByText('السعودية')).toBeInTheDocument()
  })
})
