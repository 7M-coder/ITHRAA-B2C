import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import i18n from 'i18next'
import en from '../../../../public/locales/en/accommodation.json'
import { AccommodationForm } from '../components/AccommodationForm'
import { currentRecord } from './fixtures'
beforeEach(async () => {
  i18n.addResourceBundle('en', 'accommodation', en)
  await i18n.changeLanguage('en')
}, 35000)
it('validates capacity on submission and saves edits with ISO dates', async () => {
  const save = vi.fn()
  render(<AccommodationForm record={currentRecord} onClose={vi.fn()} onSave={save} />)
  expect(screen.getByRole('columnheader', { name: en.pricing.rateColumn })).toBeInTheDocument()
  expect(screen.queryByLabelText(en.rooms.suites)).not.toBeInTheDocument()
  const heading = screen.getByRole('heading', { name: en.contractDetails })
  expect(
    heading.compareDocumentPosition(screen.getByLabelText(en.contractStart)) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Capacity (rooms)'), { target: { value: '89' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText('Room total exceeds capacity.')).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Capacity (rooms)'), { target: { value: '100' } })
  fireEvent.change(screen.getByLabelText('Accommodation name'), {
    target: { value: 'Updated housing' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      ...currentRecord,
      name: 'Updated housing',
      board: undefined
    })
  )
}, 35000)
it('requires a meal plan and clears it when catering is disabled', async () => {
  const save = vi.fn()
  render(
    <AccommodationForm
      record={{ ...currentRecord, catering: true, board: 'full' }}
      onClose={vi.fn()}
      onSave={save}
    />
  )
  expect(screen.getByLabelText('Meal plan')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'No' }))
  expect(screen.queryByLabelText('Meal plan')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(save).toHaveBeenCalledWith({ ...currentRecord, board: undefined }))
}, 35000)

it('requires a contract price when editing a legacy housing currentRecord', async () => {
  const save = vi.fn()
  render(
    <AccommodationForm
      record={{ ...currentRecord, contractPrice: undefined }}
      onClose={vi.fn()}
      onSave={save}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(await screen.findByText(en.errors.priceRequired)).toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText(en.contractPrice), { target: { value: '210250' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      ...currentRecord,
      contractPrice: currentRecord.contractPrice,
      board: undefined
    })
  )
}, 35000)

it('saves an independent contract value without comparing it with bed rates', async () => {
  const save = vi.fn()
  render(<AccommodationForm record={currentRecord} onClose={vi.fn()} onSave={save} />)
  fireEvent.change(screen.getByLabelText(en.contractPrice), { target: { value: '123' } })
  expect(screen.queryByText(en.errors.contractMismatch)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({ ...currentRecord, contractPrice: 123, board: undefined })
  )
}, 35000)
