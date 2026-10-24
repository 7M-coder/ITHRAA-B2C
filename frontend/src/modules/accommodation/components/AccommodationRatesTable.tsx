import { Table, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Accommodation } from '../types/domain'
import { nightlyBedSellingPricing } from '../utils/pricing'
import { bedsPerRoom, pricedRoomTypes } from '../utils/rooms'
interface Props {
  record: Accommodation
}
/** Displays saved room inventory and clearly labelled rate units. @param props - Housing record. @returns Read-only room rates table. */
export function AccommodationRatesTable({ record }: Props) {
  const { t, i18n } = useTranslation('accommodation')
  const perBed =
    record.pricingBasis === 'bed_night' ||
    record.pricingBasis === 'bed_rate_total' ||
    record.pricingBasis === 'bed_night_three'
  return (
    <div className="my-4 space-y-3">
      <Typography.Title level={5}>{t('pricing.roomRatesTitle')}</Typography.Title>
      <Table
        rowKey="key"
        bordered
        size="small"
        pagination={false}
        scroll={{ x: 580 }}
        dataSource={pricedRoomTypes.map((key) => ({ key }))}
        columns={[
          { key: 'type', title: t('pricing.roomType'), render: (_, row) => t('rooms.' + row.key) },
          {
            key: 'count',
            title: t('pricing.roomCount'),
            render: (_, row) => record.rooms[row.key]
          },
          ...(perBed
            ? [
                {
                  key: 'beds',
                  title: t('pricing.bedCount'),
                  render: (_: unknown, row: { key: (typeof pricedRoomTypes)[number] }) =>
                    record.rooms[row.key] * bedsPerRoom[row.key]
                }
              ]
            : []),
          {
            key: 'price',
            title: t(perBed ? 'pricing.rateColumn' : 'pricing.legacyRateColumn'),
            render: (_, row) =>
              record.roomRates?.[row.key] === undefined
                ? t('notRecorded')
                : new Intl.NumberFormat(i18n.language, {
                    style: 'currency',
                    currency: 'SAR'
                  }).format(record.roomRates[row.key]!)
          },
          {
            key: 'profit',
            title: t('pricing.profit'),
            render: (_, row) =>
              new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'SAR' }).format(
                record.roomProfits?.[row.key as 'double' | 'triple' | 'quadruple'] ?? 0
              )
          },
          {
            key: 'final',
            title: t('pricing.bedBeforeTaxWithProfit'),
            render: (_, row) => {
              if (!perBed) return t('notRecorded')
              const pricing = nightlyBedSellingPricing(
                record.roomRates?.[row.key],
                record.roomProfits?.[row.key as 'double' | 'triple' | 'quadruple'] ?? 0
              )
              return pricing
                ? new Intl.NumberFormat(i18n.language, {
                    style: 'currency',
                    currency: 'SAR'
                  }).format((pricing.base + pricing.profit) / 100)
                : t('notRecorded')
            }
          }
        ]}
      />
    </div>
  )
}
