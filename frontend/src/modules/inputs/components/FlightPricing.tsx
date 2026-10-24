import { Descriptions, Form } from 'antd'
import { useTranslation } from 'react-i18next'
import { flightPricing } from '../utils/pricing'
import { FlightField } from './FlightField'
interface Props {
  readOnly?: boolean
}
/** Displays live whole-ticket pricing without adding taxes or multiplying seats. @param props - Read-only state. @returns Price controls and derived totals. */
export function FlightPricing({ readOnly }: Props) {
  const { t } = useTranslation('inputs')
  const form = Form.useFormInstance()
  const currency = Form.useWatch('currency', form)
  const ticketPrice = Form.useWatch('ticketPrice', form)
  const profit = Form.useWatch('profit', form)
  const euroRate = Form.useWatch('euroRate', form)
  const pricing = flightPricing({ currency, ticketPrice, profit, euroRate })
  /** Formats minor units without replacing missing amounts with zero. @param amount - Minor-unit amount. @returns Two-decimal display or incomplete text. */
  const format = (amount: number | null | undefined) =>
    amount === null || amount === undefined ? t('incomplete') : (amount / 100).toFixed(2)
  return (
    <section className="mb-6 space-y-4">
      <h2 className="text-lg font-semibold">{t('groups.pricing')}</h2>
      <p className="text-sm text-muted">{t('ticketPricingNote')}</p>
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
        {['currency', 'ticketPrice', 'profit'].map((field) => (
          <FlightField key={field} field={field} readOnly={readOnly} />
        ))}
        {currency === 'EUR' && <FlightField field="euroRate" readOnly={readOnly} />}
      </div>
      <Descriptions
        bordered
        column={1}
        items={[
          {
            key: 'final',
            label: t('fields.finalTicketPrice'),
            children: `${format(pricing?.final)}${currency ? ` ${t(`currencies.${currency}`)}` : ''}`
          },
          {
            key: 'rate',
            label: t('fields.exchangeRate'),
            children:
              currency === 'USD'
                ? '3.80'
                : currency === 'SAR'
                  ? '1.00'
                  : (euroRate ?? t('incomplete'))
          },
          { key: 'sar', label: t('fields.sarEquivalent'), children: format(pricing?.sar) }
        ]}
      />
    </section>
  )
}
