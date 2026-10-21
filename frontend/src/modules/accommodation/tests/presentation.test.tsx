import { render, screen, within } from '@testing-library/react'
import { App } from 'antd'
import { expect, it } from 'vitest'
import i18n from 'i18next'
import en from '../../../../public/locales/en/accommodation.json'
import ar from '../../../../public/locales/ar/accommodation.json'
import AccommodationPage from '../pages/AccommodationPage'
import { AccommodationDetails } from '../components/AccommodationDetails'
import { AccommodationForm } from '../components/AccommodationForm'
import { record } from './fixtures'
it.each(['ar', 'en'])('shows unified number as the first table column in %s', async (language) => {
  i18n.addResourceBundle(language, 'accommodation', language === 'ar' ? ar : en)
  await i18n.changeLanguage(language)
  render(
    <App>
      <AccommodationPage />
    </App>
  )
  expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent(
    language === 'ar' ? ar.unifiedNumber : en.unifiedNumber
  )
})
it('shows all saved room rates and a matching tax summary in details', async () => {
  i18n.addResourceBundle('en', 'accommodation', en)
  await i18n.changeLanguage('en')
  render(<AccommodationDetails record={record} onClose={() => {}} />)
  expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
  expect(screen.getByRole('columnheader', { name: en.pricing.item })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: en.pricing.amount })).toBeInTheDocument()
  expect(screen.getByText(en.pricing.matched)).toBeInTheDocument()
  for (const label of [
    en.pricing.base,
    en.pricing.vat,
    en.pricing.city,
    en.pricing.accommodation,
    en.pricing.collection,
    en.pricing.total,
    en.pricing.difference
  ])
    expect(screen.getByText(label)).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: en.pricing.rateColumn })).toBeInTheDocument()
  const doubleRow = screen.getByText(en.rooms.double).closest('tr')!
  expect(within(doubleRow).getByText(String(record.rooms.double))).toBeInTheDocument()
  expect(doubleRow).toHaveTextContent('10.00')
  expect(screen.getByText(en.unifiedNumber).closest('tr')).toBe(
    screen.getByText(en.unifiedNumber).closest('tbody')?.firstElementChild
  )
})

it.each(['ar', 'en'])(
  'shows unified number as the first form input before city in %s',
  async (language) => {
    const locale = language === 'ar' ? ar : en
    i18n.addResourceBundle(language, 'accommodation', locale)
    await i18n.changeLanguage(language)
    render(<AccommodationForm onClose={() => {}} onSave={() => {}} />)
    const input = screen.getByLabelText(locale.unifiedNumber)
    expect(screen.getByRole('dialog').querySelector('input')).toBe(input)
    expect(
      input.compareDocumentPosition(screen.getByLabelText(locale.city)) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  },
  35000
)
