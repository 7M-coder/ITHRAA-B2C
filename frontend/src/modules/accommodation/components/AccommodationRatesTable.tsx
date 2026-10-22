import { Table, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Accommodation } from '../types/domain'
import { roomTypes } from '../utils/rooms'
interface Props {
  record: Accommodation
}
/** Displays saved room inventory and clearly labelled rate units. @param props - Housing record. @returns Read-only room rates table. */
export function AccommodationRatesTable({ record }: Props) {
  const { t, i18n } = useTranslation('accommodation')
  const perBed = record.pricingBasis === 'bed_night' || record.pricingBasis === 'bed_rate_total'
  return (
    <div className="my-4 space-y-3">
      <Typography.Title level={5}>{t('pricing.roomRatesTitle')}</Typography.Title>
      <Table
        rowKey="key"
        bordered
        size="small"
        pagination={false}
        scroll={{ x: 580 }}
        dataSource={roomTypes.map((key) => ({ key }))}
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
                  title: t('pricing.bedsPerRoom'),
                  render: (_: unknown, row: { key: (typeof roomTypes)[number] }) =>
                    row.key === 'suites'
                      ? (record.suiteBeds ?? t('notRecorded'))
                      : { double: 2, triple: 3, quadruple: 4 }[row.key]
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
          }
        ]}
      />
    </div>
  )
}
