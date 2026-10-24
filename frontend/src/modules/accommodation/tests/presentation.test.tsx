import { render, screen, within } from '@testing-library/react'
import { App } from 'antd'
import { expect, it } from 'vitest'
import i18n from 'i18next'
import en from '../../../../public/locales/en/accommodation.json'
import ar from '../../../../public/locales/ar/accommodation.json'
import AccommodationPage from '../pages/AccommodationPage'
import { AccommodationDetails } from '../components/AccommodationDetails'
import { AccommodationForm } from '../components/AccommodationForm'
import { currentRecord } from './fixtures'
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
it('shows separate nightly bed tax tables without a contract comparison', async () => {
  i18n.addResourceBundle('en', 'accommodation', en)
  await i18n.changeLanguage('en')
  render(
    <AccommodationDetails
      record={{ ...currentRecord, roomRates: { double: 100, triple: 80, quadruple: 60 } }}
      onClose={() => {}}
    />
  )
  for (const [type, total] of [
    ['double', '125.00'],
    ['triple', '100.00'],
    ['quadruple', '75.00']
  ] as const) {
    const section = screen.getByRole('region', { name: en.pricing.bedTitles[type] })
    expect(within(section).getByText(total, { exact: false })).toBeInTheDocument()
    expect(within(section).getAllByRole('row')).toHaveLength(8)
    expect(within(section).queryByText(en.contractPrice)).not.toBeInTheDocument()
    expect(within(section).queryByText(en.pricing.difference)).not.toBeInTheDocument()
  }
  expect(screen.queryByText(en.pricing.matched)).not.toBeInTheDocument()
}, 15000)

it('shows total beds for the three priced room types and keeps suites out of the rate table', async () => {
  i18n.addResourceBundle('en', 'accommodation', en)
  await i18n.changeLanguage('en')
  render(
    <AccommodationDetails
      record={{ ...currentRecord, rooms: { ...currentRecord.rooms, double: 50 } }}
      onClose={() => {}}
    />
  )
  expect(screen.getByRole('columnheader', { name: en.pricing.bedCount })).toBeInTheDocument()
  const doubleRow = screen.getByText(en.rooms.double).closest('tr')!
  expect(within(doubleRow).getByText('50')).toBeInTheDocument()
  expect(within(doubleRow).getByText('100')).toBeInTheDocument()
  expect(screen.getByText(en.rooms.quadruple).closest('tr')).toBeInTheDocument()
  expect(screen.queryByText(en.rooms.suites)).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.contractDetails })).toBeInTheDocument()
}, 15000)

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
