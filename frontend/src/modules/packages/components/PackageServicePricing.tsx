import { Alert, Card, Form, InputNumber, Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import type { ServicePriceId } from '../types/editor'
import { editorData } from '../utils/finance'
import {
  OPTIONAL_SERVICE_PRICE_IDS,
  REQUIRED_SERVICE_PRICE_IDS,
  SERVICE_VAT_RATE
} from '../utils/servicePricing'
import { EditorField } from './EditorField'

/** Captures fixed per-pilgrim service prices and the optional special services. @param props - Controlled package editor. @returns Service pricing fields. */
export function PackageServicePricing({ item, onChange }: EditorStepProps) {
  const { t } = useTranslation('packages')
  const editor = editorData(item)
  const update = (id: ServicePriceId, patch: { amount?: number | null; enabled?: boolean }) =>
    onChange({
      ...item,
      editor: {
        ...editor,
        servicePrices: editor.servicePrices.map((service) =>
          service.id === id ? { ...service, ...patch } : service
        )
      }
    })
  const renderPriceField = (id: ServicePriceId) => {
    const service = editor.servicePrices.find((entry) => entry.id === id)
    if (!service) return null
    const optional = OPTIONAL_SERVICE_PRICE_IDS.includes(id)
    return (
      <Card key={id} size="small" title={t(`editor.servicePrices.items.${id}`)}>
        <Form layout="vertical">
          <div className="grid items-end gap-x-4 sm:grid-cols-2">
            {optional && (
              <EditorField label={t('editor.servicePrices.enabled')}>
                <Switch
                  checked={service.enabled}
                  onChange={(enabled) =>
                    update(id, { enabled, amount: enabled ? service.amount : null })
                  }
                />
              </EditorField>
            )}
            {service.enabled && (
              <EditorField label={t('editor.servicePrices.amountBeforeVat')}>
                <InputNumber
                  aria-label={`${t(`editor.servicePrices.items.${id}`)} ${t('editor.servicePrices.amountBeforeVat')}`}
                  className="w-full!"
                  min={0}
                  max={1e10}
                  precision={2}
                  changeOnBlur={false}
                  value={service.amount}
                  addonAfter={item.currency === 'SAR' ? t('editor.riyal') : item.currency}
                  onChange={(amount) => update(id, { amount })}
                />
              </EditorField>
            )}
            {service.enabled && service.amount !== null && (
              <p className="mb-6 text-sm text-muted">
                {t('editor.servicePrices.vatAmount')}:{' '}
                {((service.amount * SERVICE_VAT_RATE) / 100).toFixed(2)} ·{' '}
                {t('editor.servicePrices.totalWithVat')}:{' '}
                {(service.amount * (1 + SERVICE_VAT_RATE / 100)).toFixed(2)}{' '}
                {item.currency === 'SAR' ? t('editor.riyal') : item.currency}
              </p>
            )}
          </div>
        </Form>
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message={t('editor.servicePrices.vatNotice', { rate: SERVICE_VAT_RATE })}
      />
      <h3>{t('editor.servicePrices.requiredTitle')}</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {REQUIRED_SERVICE_PRICE_IDS.map(renderPriceField)}
      </div>
      <h3>{t('editor.servicePrices.optionalTitle')}</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {OPTIONAL_SERVICE_PRICE_IDS.map(renderPriceField)}
      </div>
    </div>
  )
}
