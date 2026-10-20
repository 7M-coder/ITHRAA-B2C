import { Collapse, Descriptions, Drawer } from 'antd'
import { useTranslation } from 'react-i18next'
import type { HajjPackage, ServiceProvider } from '../types/domain'
import { PackageDetails } from './PackageDetails'

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
    <Drawer
      classNames={{ wrapper: 'max-w-full' }}
      open={open}
      onClose={onClose}
      width={620}
      title={item.name}
    >
      <PackageDetails item={item} provider={provider} />
      {Object.keys(item.services).length > 0 && (
        <Collapse
          className="mt-5"
          items={[
            {
              key: 'legacy',
              label: t('editor.legacyServices'),
              children: (
                <>
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
                                      label={t(
                                        `fields.${serviceFieldLabels[key]?.[field] ?? field}`,
                                        {
                                          defaultValue: field
                                        }
                                      )}
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
                </>
              )
            }
          ]}
        />
      )}
    </Drawer>
  )
}
