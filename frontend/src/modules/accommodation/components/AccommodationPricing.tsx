import { Alert, Table, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { housingTaxRates, nightlyBedSellingPricing, type RoomRates } from '../utils/pricing'
import { pricedRoomTypes } from '../utils/rooms'
interface Props {
  rates?: RoomRates
  profits?: RoomRates
  pricingBasis?: 'room_contract' | 'bed_night' | 'bed_rate_total' | 'bed_night_three'
}
/** Displays each room type's nightly bed rate and independent taxes. @param props - Saved or watched nightly rates. @returns Three per-bed tax tables. */
export function AccommodationPricing({ rates, profits, pricingBasis }: Props) {
  const { t, i18n } = useTranslation('accommodation')
  if (!pricingBasis || pricingBasis === 'room_contract')
    return <Alert className="my-4!" type="info" message={t('pricing.legacyRates')} />
  const format = (amount: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'SAR'
    }).format(amount / 100)
  return (
    <div className="my-4 space-y-5">
      {pricedRoomTypes.map((key) => {
        const pricing = nightlyBedSellingPricing(rates?.[key], profits?.[key] ?? 0)
        return (
          <section key={key} aria-label={t('pricing.bedTitles.' + key)}>
            <Typography.Title level={5}>{t('pricing.bedTitles.' + key)}</Typography.Title>
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
                  label: t('pricing.bedBase'),
                  value: pricing ? format(pricing.base) : t('notRecorded')
                },
                ...Object.keys(housingTaxRates).map((tax) => ({
                  key: tax,
                  label: t('pricing.' + tax),
                  value: pricing
                    ? format(pricing.taxes[tax as keyof typeof housingTaxRates])
                    : t('notRecorded')
                })),
                {
                  key: 'profit',
                  label: t('pricing.profit'),
                  value: pricing ? format(pricing.profit) : t('notRecorded')
                },
                {
                  key: 'total',
                  label: t('pricing.bedSellingTotal'),
                  value: pricing ? format(pricing.total) : t('notRecorded')
                }
              ]}
            />
          </section>
        )
      })}
    </div>
  )
}
