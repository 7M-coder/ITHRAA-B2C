import { beforeEach, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import i18n from 'i18next'
import ThemeProvider from '@/context/ThemeProvider'
import CustodyPage from '../pages/CustodyPage'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { seedData } from '../../core/utils/seed'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useDemoStore.setState({ ...seedData(), assets: [], inventory: [], clearances: [] })
})
it('lets the manager record receipt of an older physical record without setup', async () => {
  const original = seedData().assets[0]
  useDemoStore.setState({ assets: [original], inventory: [] })
  render(
    <ThemeProvider>
      <CustodyPage />
    </ThemeProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Details' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Record asset receipt' }))
  fireEvent.change(screen.getByLabelText('Notes (optional)'), {
    target: { value: 'Laptop and charger received in good condition' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(useDemoStore.getState().assets[0].workflow!.phase).toBe('closed'))
  const state = useDemoStore.getState()
  expect(state.assets[0]).toMatchObject({ ...original, status: 'Returned' })
  expect(state.inventory).toEqual([])
}, 40000)
it('hides closure from the employee and lets the manager record receipt and close', async () => {
  const run = useDemoStore.getState().custodyAction
  const manager = { role: 'manager' as const }
  for (const [id, employeeId, description] of [
    ['mine', 'employee-1', 'My advance'],
    ['other', 'employee-2', 'Other advance']
  ]) {
    run(
      {
        type: 'create',
        id,
        employeeId,
        description,
        kind: 'financial',
        amount: 100,
        dueDate: '2099-12-31'
      },
      manager
    )
  }
  render(
    <ThemeProvider>
      <CustodyPage />
    </ThemeProvider>
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Employee' }))
  expect(screen.getByText('My advance')).toBeInTheDocument()
  expect(screen.queryByText('Other advance')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Create custody' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Details' }))
  const drawer = await screen.findByRole('dialog')
  expect(
    within(drawer).queryByRole('button', { name: 'Record receipt and close custody' })
  ).not.toBeInTheDocument()
  expect(within(drawer).getByRole('button', { name: 'Add purchase / invoice' })).toBeInTheDocument()
  fireEvent.click(within(drawer).getByRole('button', { name: 'Close' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Custody manager' }))
  fireEvent.click(
    within(screen.getByRole('row', { name: /My advance/ })).getByRole('button', { name: 'Details' })
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Record receipt and close custody' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(useDemoStore.getState().assets.find((a) => a.id === 'mine')?.status).toBe('Returned')
  )
}, 40000)
