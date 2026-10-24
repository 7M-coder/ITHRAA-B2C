import { useState } from 'react'
import { Alert, App, Button, Drawer, Form } from 'antd'
import { useTranslation } from 'react-i18next'
import type { InternationalFlightRequest } from '../types/domain'
import { flightWriteSchema } from '../validations/schemas'
import { bookingFields } from '../utils/fields'
import { FlightField } from './FlightField'
import { FlightJourney } from './FlightJourney'
import { FlightPricing } from './FlightPricing'
import { FlightHistory } from './FlightHistory'
interface Props {
  open: boolean
  request?: InternationalFlightRequest
  readOnly?: boolean
  onClose: () => void
  onSave: (request: InternationalFlightRequest) => void
}
/** Edits inbound and outbound journeys with paired departure/arrival details. @param props - Drawer controls and selected record. @returns Booking drawer. */
export function FlightForm({ open, request, readOnly, onClose, onSave }: Props) {
  const { t } = useTranslation('inputs')
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const [error, setError] = useState<string>()
  const [dirty, setDirty] = useState(false)
  /** Confirms abandonment of edits. @returns Nothing. */
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
  /** Validates the entire booking and retains archived values. @param values - Form values. @returns Nothing. */
  const submit = (values: InternationalFlightRequest) => {
    const parsed = flightWriteSchema.safeParse({
      ...values,
      id: request?.id ?? crypto.randomUUID(),
      historical: request?.notes
        ? { ...request.historical, notes: request.notes }
        : request?.historical,
      inbound: values.inbound ?? [],
      outbound: values.outbound ?? []
    })
    if (!parsed.success) {
      form.setFields(
        parsed.error.issues
          .filter((issue) => issue.message !== 'identity')
          .map((issue) => ({
            name: issue.path,
            errors: [
              t(
                [
                  'dateOrder',
                  'arrivalOrder',
                  'connectionOrder',
                  'returnOrder',
                  'englishOnly'
                ].includes(issue.message)
                  ? `errors.${issue.message}`
                  : 'errors.value'
              )
            ]
          }))
      )
      setError(
        t(
          parsed.error.issues.some((issue) => issue.message === 'identity')
            ? 'identityRequired'
            : 'errors.value'
        )
      )
      return
    }
    setError(undefined)
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
      {error && <Alert className="mb-5!" type="error" showIcon message={error} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...request,
          currency: request?.currency ?? 'SAR',
          profit: request?.profit ?? 0,
          inbound: request?.inbound.length ? request.inbound : [{ id: crypto.randomUUID() }],
          outbound: request?.outbound.length ? request.outbound : [{ id: crypto.randomUUID() }]
        }}
        onValuesChange={() => {
          setDirty(true)
          setError(undefined)
          form.setFields(
            form
              .getFieldsError()
              .filter((field) => field.errors.length)
              .map((field) => ({ name: field.name, errors: [] }))
          )
        }}
        onFinish={submit}
      >
        <section className="mb-6 border-b border-border pb-4">
          <h2 className="mb-4 text-lg font-semibold">{t('groups.booking')}</h2>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            {bookingFields.map((field) => (
              <FlightField key={field} field={field} readOnly={readOnly} />
            ))}
          </div>
        </section>
        <FlightJourney direction="inbound" readOnly={readOnly} />
        <FlightJourney direction="outbound" readOnly={readOnly} />
        <FlightPricing readOnly={readOnly} />
        <FlightHistory data={request?.historical} />
      </Form>
    </Drawer>
  )
}
