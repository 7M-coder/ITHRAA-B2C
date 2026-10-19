import { beforeEach, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'i18next'
import ThemeProvider from '@/context/ThemeProvider'
import { EmployeeForm } from '@/modules/employees/components/EmployeeForm'
import { useDemoStore } from '@/modules/core/hooks/useDemoStore'
import { seedData } from '@/modules/core/utils/seed'
import ClearancePage from '@/modules/clearance/pages/ClearancePage'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useDemoStore.setState(seedData())
})
it('creates an employee through validated form fields and persists the new record', async () => {
  render(
    <ThemeProvider>
      <EmployeeForm open onClose={() => undefined} />
    </ThemeProvider>
  )
  fireEvent.change(screen.getByLabelText('Employee name'), { target: { value: 'Demo Employee' } })
  fireEvent.change(screen.getByLabelText('ID / residence number'), {
    target: { value: '1000000099' }
  })
  fireEvent.change(screen.getByLabelText('Document expiry'), { target: { value: '2027-12-31' } })
  fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Demo Coordinator' } })
  fireEvent.change(screen.getByLabelText('IBAN'), { target: { value: 'sa0000000000000000000099' } })
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  await waitFor(() => expect(useDemoStore.getState().employees).toHaveLength(9))
  expect(useDemoStore.getState().employees[8]).toMatchObject({
    fullName: 'Demo Employee',
    idExpiryDate: '2027-12-31',
    bankIban: 'SA0000000000000000000099',
    gosiRate: 9.75
  })
  expect(localStorage.getItem('ithraa-hr-demo-v1')).toContain('Demo Employee')
})
it('preserves an edited stored GOSI rate rather than resetting it', async () => {
  const employee = { ...seedData().employees[0], gosiRate: 7 }
  render(
    <ThemeProvider>
      <EmployeeForm open employee={employee} onClose={() => undefined} />
    </ThemeProvider>
  )
  expect(screen.getByLabelText('Stored GOSI rate (%)')).toHaveValue('7.00')
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  await waitFor(() => expect(useDemoStore.getState().employees[0].gosiRate).toBe(7))
})
it('blocks clearance when the selected terminated employee has unsettled custody', () => {
  render(
    <MemoryRouter initialEntries={['/en/clearance?employee=employee-7']}>
      <ThemeProvider>
        <ClearancePage />
      </ThemeProvider>
    </MemoryRouter>
  )
  expect(screen.getByRole('button', { name: /Issue final clearance/ })).toBeDisabled()
  expect(
    screen.getByText(
      'Clearance is blocked by assigned or lost custody. Settle these records first.'
    )
  ).toBeInTheDocument()
})
it('issues eligible clearance once and disables further issuance', async () => {
  render(
    <MemoryRouter initialEntries={['/en/clearance?employee=employee-8']}>
      <ThemeProvider>
        <ClearancePage />
      </ThemeProvider>
    </MemoryRouter>
  )
  await userEvent.click(screen.getByRole('button', { name: /Issue final clearance/ }))
  expect(screen.getByRole('button', { name: /Demo clearance issued/ })).toBeDisabled()
  expect(useDemoStore.getState().clearances).toHaveLength(1)
})
