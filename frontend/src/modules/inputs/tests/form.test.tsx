import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import i18n from 'i18next'
import en from '../../../../public/locales/en/inputs.json'
import ar from '../../../../public/locales/ar/inputs.json'
import { FlightForm } from '../components/FlightForm'

beforeEach(async () => {
  i18n.addResourceBundle('en', 'inputs', en, true, true)
  i18n.addResourceBundle('ar', 'inputs', ar, true, true)
  await i18n.changeLanguage('en')
})
describe('unified manual form', () => {
  it('saves a flight-number-only request and keeps missing financial fields empty', async () => {
    const save = vi.fn()
    const user = userEvent.setup()
    render(
      <App>
        <FlightForm open onClose={vi.fn()} onSave={save} />
      </App>
    )
    await user.click(screen.getAllByRole('button', { name: 'Add flight' })[0])
    fireEvent.change(screen.getAllByLabelText('Flight number')[1], { target: { value: 'DEMO123' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(save).toHaveBeenCalledOnce())
    expect(save.mock.calls[0][0]).toMatchObject({
      inbound: [expect.anything(), expect.objectContaining({ flightNumber: 'DEMO123' })]
    })
    expect(save.mock.calls[0][0].ticketPrice).toBeUndefined()
  }, 15000)
  it('shows an Arabic identity message for a blank request', async () => {
    await i18n.changeLanguage('ar')
    const save = vi.fn()
    const user = userEvent.setup()
    render(
      <App>
        <FlightForm open onClose={vi.fn()} onSave={save} />
      </App>
    )
    await user.click(screen.getByRole('button', { name: 'حفظ' }))
    expect(await screen.findByText(ar.identityRequired)).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  }, 15000)
})
