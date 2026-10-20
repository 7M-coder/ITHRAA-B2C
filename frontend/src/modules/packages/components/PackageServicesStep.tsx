import { Alert, Button, Card, Checkbox, Collapse, Empty, Form, Input, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import type { ServiceItem } from '../types/editor'
import { editorData } from '../utils/finance'
import { transportModes } from '../utils/transport'
import { createEntityId } from '../utils/domain'
import { EditorField } from './EditorField'
/** Records only intercity and Mashair transport; retained legacy service records stay read-only. @param props - Controlled package. @returns Transport fields. */
export function PackageServicesStep({ item, onChange, providers = [] }: EditorStepProps) {
  const { t } = useTranslation('packages')
  const e = editorData(item)
  const services = e.services.filter((s) => s.category === 'transportation')
  const legacy = e.services.filter((s) => s.category !== 'transportation')
  const update = (id: string, patch: Partial<ServiceItem>) =>
    onChange({
      ...item,
      editor: { ...e, services: e.services.map((s) => (s.id === id ? { ...s, ...patch } : s)) }
    })
  return (
    <div className="space-y-5">
      <p className="text-muted">{t('editor.servicesNote')}</p>
      {!services.length && <Empty description={t('editor.noServices')} />}
      {services.map((s) => (
        <Card
          key={s.id}
          extra={
            <Button
              danger
              onClick={() =>
                onChange({
                  ...item,
                  editor: { ...e, services: e.services.filter((v) => v.id !== s.id) }
                })
              }
            >
              {t('actions.remove')}
            </Button>
          }
        >
          <Form layout="vertical">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <EditorField label={t('editor.serviceType')}>
                <Select
                  aria-label={t('editor.serviceType')}
                  value={s.transportType}
                  options={['intercity', 'mashair'].map((value) => ({
                    value,
                    label: t(`editor.transportTypes.${value}`)
                  }))}
                  onChange={(transportType) =>
                    update(s.id, { transportType, transportMode: undefined, providerId: undefined })
                  }
                />
              </EditorField>
              <EditorField label={t('editor.transportMode')}>
                <Select
                  aria-label={t('editor.transportMode')}
                  disabled={!s.transportType}
                  value={s.transportMode}
                  options={(s.transportType ? transportModes[s.transportType] : []).map(
                    (value) => ({ value, label: t(`editor.transportModes.${value}`) })
                  )}
                  onChange={(transportMode) =>
                    update(s.id, { transportMode, providerId: undefined })
                  }
                />
              </EditorField>
              {s.transportMode && (
                <EditorField label={t('editor.transportProvider')}>
                  <Select
                    aria-label={t('editor.transportProvider')}
                    showSearch
                    optionFilterProp="label"
                    allowClear
                    value={s.providerId}
                    placeholder={t('editor.chooseTransportProvider')}
                    notFoundContent={t('editor.noTransportProviders')}
                    options={providers
                      .filter(
                        (p) =>
                          (p.active && p.categories.includes('transport')) || p.id === s.providerId
                      )
                      .map((p) => ({
                        value: p.id,
                        label: p.name,
                        disabled: !p.active || !p.categories.includes('transport')
                      }))}
                    onChange={(providerId) => update(s.id, { providerId })}
                  />
                </EditorField>
              )}
            </div>
            {s.transportMode && (
              <p className="text-sm text-muted">{t('editor.transportProvidersHint')}</p>
            )}
            <Checkbox
              className="mb-4"
              checked={s.included}
              onChange={(v) => update(s.id, { included: v.target.checked })}
            >
              {t('editor.included')}
            </Checkbox>
            <EditorField label={t('editor.serviceDescription')} text>
              <Input.TextArea
                aria-label={t('editor.serviceDescription')}
                value={s.description}
                onChange={(v) => update(s.id, { description: v.target.value })}
              />
            </EditorField>
          </Form>
        </Card>
      ))}
      <Button
        onClick={() =>
          onChange({
            ...item,
            editor: {
              ...e,
              services: [
                ...e.services,
                {
                  id: createEntityId('transport'),
                  category: 'transportation',
                  description: '',
                  included: true
                }
              ]
            }
          })
        }
      >
        {t('editor.addService')}
      </Button>
      {legacy.length > 0 && (
        <Collapse
          items={[
            {
              key: 'legacy',
              label: t('editor.legacyServices'),
              children: (
                <>
                  <Alert type="info" message={t('editor.legacyTransportNote')} />
                  {legacy.map((s) => (
                    <p key={s.id}>
                      {t(`services.${s.category}`)}: {s.description || '—'}
                    </p>
                  ))}
                </>
              )
            }
          ]}
        />
      )}
    </div>
  )
}
