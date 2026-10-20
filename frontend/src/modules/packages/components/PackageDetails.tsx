import { Alert, Button, Card, Descriptions, Empty, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import { stayPeriods } from '../utils/periods'
import type { HajjPackage, ServiceProvider } from '../types/domain'
import {
  editorData,
  financialSummary,
  packageWarnings,
  readiness,
  stayNights,
  stayPeriodNights,
  servicePricing
} from '../utils/finance'
import { SERVICE_VAT_RATE } from '../utils/servicePricing'
interface Props {
  item: HajjPackage
  provider?: ServiceProvider
  onEdit?: (step: number) => void
}
/** Displays an ordered program and transparent per-pilgrim service pricing. @param props - Package and optional edit shortcuts. @returns Review content. */
export function PackageDetails({ item, onEdit }: Props) {
  const { t } = useTranslation('packages')
  const e = editorData(item)
  const missing = readiness(item)
  return (
    <div className="space-y-5">
      {packageWarnings(item).map((w) => (
        <Alert key={w} type="warning" showIcon message={t(`editor.warnings.${w}`)} />
      ))}
      {missing.length > 0 && (
        <Alert
          type="info"
          showIcon
          message={t('editor.notReady')}
          description={
            <ul className="m-0 list-inside list-disc">
              {missing.map((m) => (
                <li key={m}>{t(`editor.missing.${m}`)}</li>
              ))}
            </ul>
          }
        />
      )}
      <Card
        title={t('editor.steps.general')}
        extra={onEdit && <Button onClick={() => onEdit(0)}>{t('actions.edit')}</Button>}
      >
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            { key: 'name', label: t('fields.name'), children: item.name || '—' },
            { key: 'season', label: t('fields.season'), children: item.season || '—' },
            {
              key: 'category',
              label: t('editor.category'),
              children: e.category ? t(`editor.categories.${e.category}`) : '—'
            },
            { key: 'capacity', label: t('editor.capacity'), children: e.capacity ?? '—' },
            {
              key: 'dates',
              label: t('fields.programDates'),
              children: `${item.startDate || '—'} — ${item.endDate || '—'}`
            },
            { key: 'status', label: t('fields.status'), children: t(`values.${item.status}`) }
          ]}
        />
        <p className="whitespace-pre-wrap">{item.description}</p>
      </Card>
      <Card
        title={t('editor.steps.stays')}
        extra={onEdit && <Button onClick={() => onEdit(1)}>{t('actions.edit')}</Button>}
      >
        {!e.stays.length ? (
          <Empty description={t('editor.noStays')} />
        ) : (
          <ol className="m-0 list-none space-y-4 p-0">
            {e.stays.map((s, i) => (
              <li key={s.id} className="border-b border-line pb-3 last:border-0">
                <h4 className="m-0">
                  {i + 1}. {s.hotel || '—'} · {s.city || '—'}
                </h4>
                <p>
                  {t(`editor.${s.kind}`)} · {t('editor.totalNights')}: {stayPeriodNights(s) ?? '—'}
                </p>
                {stayPeriods(s).map((period, index) => (
                  <p key={period.id} className="text-sm">
                    {t('editor.periodNumber', { number: index + 1 })}: {period.checkIn || '—'} —{' '}
                    {period.checkOut || '—'} ·{' '}
                    {stayNights(period.checkIn, period.checkOut) !== null
                      ? t('editor.periodDuration', {
                          nights: stayNights(period.checkIn, period.checkOut),
                          days: stayNights(period.checkIn, period.checkOut)! + 1
                        })
                      : t('editor.incomplete')}
                  </p>
                ))}

                {s.contractRef && (
                  <p>
                    {t('editor.contractRef')}: {s.contractRef}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{s.notes}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
      <Card
        title={t('editor.steps.services')}
        extra={onEdit && <Button onClick={() => onEdit(2)}>{t('actions.edit')}</Button>}
      >
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 450 }}
          dataSource={e.services.filter((service) => service.category === 'transportation')}
          columns={[
            {
              title: t('editor.serviceType'),
              render: (_, s) =>
                s.transportType
                  ? t(`editor.transportTypes.${s.transportType}`)
                  : t('services.transportation')
            },
            {
              title: t('editor.transportMode'),
              render: (_, s) =>
                s.transportMode ? t(`editor.transportModes.${s.transportMode}`) : '—'
            },
            { title: t('editor.serviceDescription'), dataIndex: 'description' },
            {
              title: t('editor.included'),
              render: (_, s) => t(s.included ? 'editor.included' : 'editor.excluded')
            }
          ]}
        />
        {(item.includedServices.some((v) => v.trim()) ||
          item.excludedServices.some((v) => v.trim())) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4>{t('fields.includedServices')}</h4>
              <p className="whitespace-pre-wrap">
                {item.includedServices.filter(Boolean).join('\n') || '—'}
              </p>
            </div>
            <div>
              <h4>{t('fields.excludedServices')}</h4>
              <p className="whitespace-pre-wrap">
                {item.excludedServices.filter(Boolean).join('\n') || '—'}
              </p>
            </div>
          </div>
        )}
      </Card>
      <Card
        title={t('editor.steps.financial')}
        extra={onEdit && <Button onClick={() => onEdit(3)}>{t('actions.edit')}</Button>}
      >
        <p className="text-lg font-semibold">{financialSummary(item, t)}</p>
        <p className="text-sm text-muted">{t('editor.servicePrices.totalNote')}</p>
        <Table
          rowKey="key"
          pagination={false}
          size="small"
          dataSource={servicePricing(item).lines}
          columns={[
            {
              title: t('editor.priceComponent'),
              render: (_, line) => t(`editor.servicePrices.items.${line.id}`)
            },
            {
              title: t('editor.servicePrices.amountBeforeVat'),
              render: (_, line) =>
                line.amount === null
                  ? t('editor.incomplete')
                  : `${line.amount.base.toFixed(2)} ${item.currency === 'SAR' ? t('editor.riyal') : item.currency}`
            },
            {
              title: t('editor.servicePrices.vatAmount'),
              render: (_, line) =>
                line.amount === null
                  ? t('editor.incomplete')
                  : `${line.amount.vat.toFixed(2)} ${item.currency === 'SAR' ? t('editor.riyal') : item.currency}`
            },
            {
              title: t('editor.amountPerPerson'),
              render: (_, line) =>
                line.amount === null
                  ? t('editor.incomplete')
                  : `${line.amount.total.toFixed(2)} ${item.currency === 'SAR' ? t('editor.riyal') : item.currency}`
            },
            {
              title: t('editor.taxLabel'),
              render: () => t('editor.servicePrices.vatApplied', { rate: SERVICE_VAT_RATE })
            }
          ]}
          scroll={{ x: 650 }}
        />
      </Card>
    </div>
  )
}
