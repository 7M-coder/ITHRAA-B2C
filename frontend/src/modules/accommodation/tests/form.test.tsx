import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import i18n from 'i18next'
import en from '../../../../public/locales/en/accommodation.json'
import { AccommodationForm } from '../components/AccommodationForm'
import { record } from './fixtures'
beforeEach(async () => {
  i18n.addResourceBundle('en', 'accommodation', en)
  await i18n.changeLanguage('en')
}, 35000)
it('validates capacity on submission and saves edits with ISO dates', async () => {
  const save = vi.fn()
  render(<AccommodationForm record={record} onClose={vi.fn()} onSave={save} />)
  expect(screen.getByRole('columnheader', { name: en.pricing.rateColumn })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Capacity (rooms)'), { target: { value: '99' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Room total exceeds capacity.')).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Capacity (rooms)'), { target: { value: '100' } })
  fireEvent.change(screen.getByLabelText('Accommodation name'), {
    target: { value: 'Updated housing' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({ ...record, name: 'Updated housing', board: undefined })
  )
}, 35000)
it('requires a meal plan and clears it when catering is disabled', async () => {
  const save = vi.fn()
  render(
    <AccommodationForm
      record={{ ...record, catering: true, board: 'full' }}
      onClose={vi.fn()}
      onSave={save}
    />
  )
  expect(screen.getByLabelText('Meal plan')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'No' }))
  expect(screen.queryByLabelText('Meal plan')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(save).toHaveBeenCalledWith({ ...record, board: undefined }))
}, 35000)

it('requires a contract price when editing a legacy housing record', async () => {
  const save = vi.fn()
  render(
    <AccommodationForm
      record={{ ...record, contractPrice: undefined }}
      onClose={vi.fn()}
      onSave={save}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText(en.errors.priceRequired)).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText(en.contractPrice), { target: { value: '224750' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      ...record,
      contractPrice: record.contractPrice,
      board: undefined
    })
  )
}, 35000)

it('updates the tax comparison and blocks a mismatch until the price matches', async () => {
  const save = vi.fn()
  render(<AccommodationForm record={record} onClose={vi.fn()} onSave={save} />)
  fireEvent.change(screen.getByLabelText(en.contractPrice), { target: { value: '224751' } })
  expect(await screen.findByText(en.errors.contractMismatch)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(screen.getAllByText(en.errors.contractMismatch).length).toBeGreaterThan(1)
  )
  expect(save).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText(en.contractPrice), { target: { value: '224750' } })
  expect(await screen.findByText(en.pricing.matched)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(save).toHaveBeenCalledWith({ ...record, board: undefined }))
}, 35000)
