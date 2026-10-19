import { Descriptions, Drawer, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import type { HajjPackage, ServiceProvider } from '../types/domain'
import { getPackageDuration } from '../utils/domain'

interface PackagePreviewProps {
  item?: HajjPackage
  provider?: ServiceProvider
  open: boolean
  onClose: () => void
}

/** Presents package details and only the configured optional services. @param props - Package and drawer state. @returns Read-only package preview. */
export function PackagePreview({ item, provider, open, onClose }: PackagePreviewProps) {
  const { t } = useTranslation('packages')
  if (!item) return null
  const serviceLabels: Record<string, string> = {
    accommodation: 'services.accommodation',
    flights: 'services.flights',
    transportation: 'services.transportation',
    mashair: 'services.mashair',
    meals: 'services.meals',
    guidance: 'services.guidance',
    visa: 'services.visa',
    additional: 'services.additional'
  }
  const serviceFieldLabels: Record<string, Record<string, string>> = {
    accommodation: { name: 'accommodationName' },
    additional: { name: 'additionalName', included: 'includedFlag' }
  }
  /** Formats optional service values for localized display. @param value - Raw service value. @returns Human-readable value. */
  const formatValue = (value: unknown) =>
    typeof value === 'boolean'
      ? t(value ? 'values.yes' : 'values.no')
      : value === null || value === undefined || value === ''
        ? t('values.notSpecified')
        : String(value)
  return (
    <Drawer open={open} onClose={onClose} width={620} title={item.name}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Tag>{t(`values.${item.pilgrimType}`)}</Tag>
        <Tag color={item.status === 'available' ? 'green' : 'default'}>
          {t(`values.${item.status}`)}
        </Tag>
        <Tag color="blue">
          {item.price.toLocaleString()} {item.currency}
        </Tag>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7">
        {item.description || t('values.noDescription')}
      </p>
      <Descriptions column={1} bordered size="small" className="my-5">
        <Descriptions.Item label={t('fields.season')}>{item.season}</Descriptions.Item>
        <Descriptions.Item label={t('fields.provider')}>
          {provider?.name ?? t('values.unknownProvider')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.duration')}>
          {getPackageDuration(item.startDate, item.endDate)} {t('values.days')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.programDates')}>
          {item.startDate} — {item.endDate}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.bookingChannel')}>
          {item.bookingChannel || t('values.notSpecified')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.bookingPolicy')}>
          {item.bookingPolicy || t('values.notSpecified')}
        </Descriptions.Item>
        <Descriptions.Item label={t('fields.cancellationPolicy')}>
          {item.cancellationPolicy || t('values.notSpecified')}
        </Descriptions.Item>
      </Descriptions>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 font-bold">{t('fields.includedServices')}</h3>
          {item.includedServices.length ? (
            <ul className="list-inside list-disc">
              {item.includedServices.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('values.none')}</p>
          )}
        </section>
        <section>
          <h3 className="mb-2 font-bold">{t('fields.excludedServices')}</h3>
          {item.excludedServices.length ? (
            <ul className="list-inside list-disc">
              {item.excludedServices.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('values.none')}</p>
          )}
        </section>
      </div>
      <h3 className="mb-3 text-base font-bold">{t('sections.services')}</h3>
      <div className="space-y-4">
        {Object.entries(item.services)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => (
            <section key={key} className="rounded-lg border border-line p-4">
              <h4 className="mb-2 font-bold">{t(serviceLabels[key] ?? key)}</h4>
              <div className="space-y-3">
                {(Array.isArray(value) ? value : [value]).map((row, index) => {
                  const record = row as Record<string, unknown>
                  return (
                    <Descriptions key={index} size="small" column={1} bordered>
                      {Object.entries(record).map(([field, fieldValue]) => (
                        <Descriptions.Item
                          key={field}
                          label={t(`fields.${serviceFieldLabels[key]?.[field] ?? field}`, {
                            defaultValue: field
                          })}
                        >
                          {formatValue(fieldValue)}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  )
                })}
              </div>
            </section>
          ))}
        {Object.keys(item.services).length === 0 && (
          <p className="text-sm text-muted">{t('values.noOptionalServices')}</p>
        )}
      </div>
    </Drawer>
  )
}
