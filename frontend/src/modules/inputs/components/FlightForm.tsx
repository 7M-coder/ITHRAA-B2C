import { useState } from 'react'
import { Alert, App, Button, Card, Drawer, Form, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import type { InternationalFlightRequest } from '../types/domain'
import { flightRequestSchema } from '../validations/schemas'
import { fieldGroups, segmentFields } from '../utils/fields'
import { FlightField } from './FlightField'

interface Props {
  open: boolean
  request?: InternationalFlightRequest
  readOnly?: boolean
  onClose: () => void
  onSave: (request: InternationalFlightRequest) => void
}
/** Edits the unified booking fields and ordered journey segments. @param props - Drawer controls and record. @returns Booking drawer. */
export function FlightForm({ open, request, readOnly, onClose, onSave }: Props) {
  const { t } = useTranslation('inputs')
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [error, setError] = useState(false)
  const [dirty, setDirty] = useState(false)
  const close = () => {
    if (dirty && !readOnly)
      modal.confirm({
        title: t('discard'),
        okText: t('discardAction'),
        cancelText: t('cancel'),
        onOk: onClose
      })
    else onClose()
  }
  const submit = (values: InternationalFlightRequest) => {
    const parsed = flightRequestSchema.safeParse({
      ...values,
      id: request?.id ?? crypto.randomUUID(),
      segments: values.segments ?? []
    })
    if (!parsed.success) {
      setError(true)
      return
    }
    setError(false)
    onSave(parsed.data)
  }
  return (
    <Drawer
      open={open}
      onClose={close}
      title={t(readOnly ? 'viewFlight' : request ? 'editFlight' : 'addFlight')}
      width="min(960px, 100vw)"
      extra={
        !readOnly && (
          <Button type="primary" onClick={() => form.submit()}>
            {t('save')}
          </Button>
        )
      }
    >
      <Alert className="mb-5!" type="info" showIcon message={t('manualNote')} />
      {error && <Alert className="mb-5!" type="error" showIcon message={t('identityRequired')} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={request ?? { segments: [] }}
        onValuesChange={() => setDirty(true)}
        onFinish={submit}
      >
        {Object.entries(fieldGroups).map(([group, fields]) => (
          <section key={group} className="mb-6 border-b border-border pb-4">
            <h2 className="mb-4 text-lg font-semibold">{t(`groups.${group}`)}</h2>
            {group === 'payment' && <p className="mb-4 text-sm text-muted">{t('paymentNote')}</p>}
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <FlightField key={field} field={field} readOnly={readOnly} />
              ))}
            </div>
          </section>
        ))}
        <h2 className="mb-4 text-lg font-semibold">{t('groups.segments')}</h2>
        <Form.List name="segments">
          {(fields, { add, remove, move }) => (
            <Space direction="vertical" className="w-full!" size="middle">
              {fields.map(({ key, name }, index) => (
                <Card
                  key={key}
                  title={t('segment', { number: index + 1 })}
                  extra={
                    !readOnly && (
                      <Space>
                        <Button disabled={index === 0} onClick={() => move(index, index - 1)}>
                          {t('moveUp')}
                        </Button>
                        <Button danger onClick={() => remove(name)}>
                          {t('delete')}
                        </Button>
                      </Space>
                    )
                  }
                >
                  <Form.Item name={[name, 'id']} hidden>
                    <input />
                  </Form.Item>
                  <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                    {segmentFields.map((field) => (
                      <FlightField
                        key={field}
                        field={field}
                        segmentIndex={name}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>
                </Card>
              ))}
              {!readOnly && (
                <Button onClick={() => add({ id: crypto.randomUUID() })}>{t('addSegment')}</Button>
              )}
            </Space>
          )}
        </Form.List>
      </Form>
    </Drawer>
  )
}
