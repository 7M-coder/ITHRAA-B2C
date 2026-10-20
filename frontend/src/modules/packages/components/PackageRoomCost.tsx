import { Alert, Button, Form, InputNumber, Select, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import type { StayRoom, BedTaxRates, PackageStay } from '../types/editor'
import { stayPeriodNights } from '../utils/finance'
import { bedPrice } from '../utils/bedPricing'
import { EditorField } from './EditorField'
interface Props {
  room: StayRoom
  stay: PackageStay
  index: number
  rates?: BedTaxRates
  currency: string
  onChange: (patch: Partial<StayRoom>) => void
}
/** Edits bed-night prices and displays additive taxes and cumulative-period totals. @param props - Controlled room cost. @returns Room cost fields. */
export function PackageRoomCost({ room, stay, index, rates, currency, onChange }: Props) {
  const { t } = useTranslation('packages')
  const nights = stayPeriodNights(stay)
  const price =
    room.tax === 'unknown'
      ? null
      : bedPrice(
          room.amount,
          room.tax === 'included' ? { vat: 0, accommodation: 0, collection: 0, city: 0 } : rates
        )
  const unit = currency === 'SAR' ? t('editor.riyal') : currency
  return (
    <section className="mb-5 border-b border-line pb-4">
      <h4>{t('editor.occupancy', { count: room.occupancy })}</h4>
      {room.basis !== 'bed_night' ? (
        <>
          <Alert
            className="mb-3"
            type="warning"
            message={t('editor.legacyCostNote')}
            description={`${t(`editor.${room.basis}`)}: ${room.amount ?? '—'} ${unit}`}
          />
          <Form layout="vertical">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <EditorField label={t('editor.amount')}>
                <InputNumber
                  aria-label={`${t('editor.amount')} ${index + 1} / ${room.occupancy}`}
                  changeOnBlur={false}
                  value={room.amount}
                  onChange={(amount) => onChange({ amount })}
                />
              </EditorField>
              <EditorField label={t('editor.taxLabel')}>
                <Select
                  aria-label={t('editor.taxLabel')}
                  value={room.tax}
                  options={['included', 'excluded', 'unknown'].map((value) => ({
                    value,
                    label: t(`editor.tax.${value}`)
                  }))}
                  onChange={(tax) => onChange({ tax })}
                />
              </EditorField>
            </div>
          </Form>
          <Button
            onClick={() =>
              onChange({
                legacyAmount: room.amount,
                legacyBasis: room.basis === 'room_night' ? 'room_night' : 'bed_stay',
                amount: null,
                basis: 'bed_night',
                tax: 'excluded'
              })
            }
          >
            {t('editor.useBedNight')}
          </Button>
        </>
      ) : (
        <>
          <Form layout="vertical">
            {room.tax !== 'excluded' && (
              <p className="text-sm text-muted">{t(`editor.tax.${room.tax}`)}</p>
            )}
            <EditorField label={t('editor.bedNightPrice')}>
              <InputNumber
                aria-label={`${t('editor.bedNightPrice')} ${index + 1} / ${room.occupancy}`}
                changeOnBlur={false}
                className="w-full!"
                value={room.amount}
                onChange={(amount) => onChange({ amount, tax: 'excluded' })}
              />
            </EditorField>
          </Form>
          {room.legacyBasis && (
            <p className="text-sm text-muted">
              {t('editor.previousCost')}: {room.legacyAmount ?? '—'} {unit} (
              {t(`editor.${room.legacyBasis}`)})
            </p>
          )}
          <Table
            size="small"
            pagination={false}
            rowKey="key"
            scroll={{ x: 600 }}
            dataSource={[{ key: 'night' }]}
            columns={(['base', 'vat', 'accommodation', 'collection', 'city', 'total'] as const).map(
              (key) => ({
                key,
                title: t(`editor.bedTaxLabels.${key}`),
                render: () => price?.[key].toFixed(2) ?? t('editor.incomplete')
              })
            )}
          />

          <p className="mt-3 font-semibold">
            {t('editor.totalBedStay')}:{' '}
            {price && nights !== null ? (price.total * nights).toFixed(2) : t('editor.incomplete')}{' '}
            {unit}
          </p>
          <p className="text-sm text-muted">
            {t('editor.bedFormula', {
              price: price?.total.toFixed(2) ?? '—',
              nights: nights ?? '—'
            })}
          </p>
        </>
      )}
    </section>
  )
}
