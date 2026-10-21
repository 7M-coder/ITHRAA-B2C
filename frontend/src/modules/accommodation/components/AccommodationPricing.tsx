import { Alert, Table, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import type { RoomCounts } from '../types/domain'
import {
  housingPricing,
  bedNightPricing,
  bedRatePricing,
  contractNights,
  housingTaxRates,
  toHalalas,
  type RoomRates
} from '../utils/pricing'
interface Props {
  rooms?: Partial<RoomCounts>
  rates?: RoomRates
  contractPrice?: number
  pricingBasis?: 'room_contract' | 'bed_night' | 'bed_rate_total'
  periods?: { start: string; end: string }[]
  suiteBeds?: number
}
/** Displays independent taxes and exact contract reconciliation. @param props - Watched or saved room pricing. @returns Pricing summary in SAR. */
export function AccommodationPricing({
  rooms,
  rates,
  contractPrice,
  pricingBasis,
  periods,
  suiteBeds
}: Props) {
  const { t, i18n } = useTranslation('accommodation')
  const pricing =
    pricingBasis === 'bed_rate_total'
      ? bedRatePricing(rooms, rates, suiteBeds)
      : pricingBasis === 'bed_night'
        ? bedNightPricing(rooms, rates, periods, suiteBeds)
        : housingPricing(rooms, rates)
  const nights = contractNights(periods)
  const contract = toHalalas(contractPrice)
  const format = (amount: number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'SAR' }).format(
      amount / 100
    )
  const difference = pricing !== null && contract !== null ? pricing.total - contract : null
  return (
    <div className="my-4 space-y-3">
      {pricingBasis === 'bed_rate_total' ? (
        <p>{t('pricing.legacyBedTotal')}</p>
      ) : pricingBasis === 'bed_night' ? (
        <div>
          <p>{t('pricing.rateHelp')}</p>
          <p>{t('pricing.nights', { count: nights ?? 0 })}</p>
        </div>
      ) : (
        <Alert type="info" message={t('pricing.legacyRates')} />
      )}
      <Typography.Title level={5}>{t('pricing.title')}</Typography.Title>
      <Table
        rowKey="key"
        size="small"
        bordered
        pagination={false}
        scroll={{ x: 420 }}
        columns={[
          { title: t('pricing.item'), dataIndex: 'label', key: 'label' },
          { title: t('pricing.amount'), dataIndex: 'value', key: 'value', width: 180 }
        ]}
        dataSource={[
          {
            key: 'base',
            label: t('pricing.base'),
            value: pricing ? format(pricing.base) : t('notRecorded')
          },
          ...Object.keys(housingTaxRates).map((key) => ({
            key,
            label: t('pricing.' + key),
            value: pricing
              ? format(pricing.taxes[key as keyof typeof housingTaxRates])
              : t('notRecorded')
          })),
          {
            key: 'total',
            label: t('pricing.total'),
            value: pricing ? format(pricing.total) : t('notRecorded')
          },
          {
            key: 'contract',
            label: t('contractPrice'),
            value: contract !== null ? format(contract) : t('notRecorded')
          },
          {
            key: 'difference',
            label: t('pricing.difference'),
            value: difference !== null ? format(difference) : t('notRecorded')
          }
        ]}
      />
      <Alert
        showIcon
        type={difference === null ? 'info' : difference === 0 ? 'success' : 'error'}
        message={t(
          difference === null
            ? 'pricing.incomplete'
            : difference === 0
              ? 'pricing.matched'
              : 'errors.contractMismatch'
        )}
      />
    </div>
  )
}
