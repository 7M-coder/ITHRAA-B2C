import { Alert, Form, Input, InputNumber, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import type { InternationalFlightRequest } from '../types/domain'
import { flightInputSchemas, flightRequestSchema, inputRules } from '../validations/schemas'

interface Props {
  open: boolean
  request?: InternationalFlightRequest
  onClose: () => void
  onSave: (request: InternationalFlightRequest) => void
}

/** Edits a PNR booking request in the supplied workbook layout. @param props - Dialog controls and selected request. @returns Flight request form. */
export function FlightForm({ open, request, onClose, onSave }: Props) {
  const { t } = useTranslation('inputs')
  const [form] = Form.useForm<InternationalFlightRequest>()
  const submit = (values: InternationalFlightRequest) => {
    const parsed = flightRequestSchema.safeParse({
      ...values,
      id: request?.id ?? crypto.randomUUID()
    })
    if (parsed.success) onSave(parsed.data)
  }
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => void form.submit()}
      title={t(request ? 'editFlight' : 'addFlight')}
      okText={t('save')}
      cancelText={t('cancel')}
      width={850}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={request} onFinish={submit}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          <Form.Item
            name="pnr"
            label={t('fields.pnr')}
            rules={inputRules(flightRequestSchema.shape.pnr, t('errors.required'))}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="arrivalDate"
            label={t('fields.arrivalDate')}
            rules={inputRules(flightInputSchemas.isoDate, t('errors.date'))}
          >
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="arrivalRoute"
            label={t('fields.arrivalRoute')}
            rules={inputRules(flightInputSchemas.text, t('errors.required'))}
          >
            <Input placeholder={t('routeExampleArrival')} />
          </Form.Item>
          <Form.Item
            name="departureDate"
            label={t('fields.departureDate')}
            rules={inputRules(flightInputSchemas.isoDate, t('errors.date'))}
          >
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item
            name="departureRoute"
            label={t('fields.departureRoute')}
            rules={inputRules(flightInputSchemas.text, t('errors.required'))}
          >
            <Input placeholder={t('routeExampleDeparture')} />
          </Form.Item>
          <Form.Item
            name="currency"
            label={t('fields.currency')}
            rules={inputRules(flightRequestSchema.shape.currency, t('errors.currency'))}
          >
            <Input maxLength={3} />
          </Form.Item>
          {(
            ['fare', 'otherTaxes', 'farePerPassenger', 'passengersRequested', 'totalFare'] as const
          ).map((field) => (
            <Form.Item
              key={field}
              name={field}
              label={t(`fields.${field}`)}
              rules={inputRules(flightRequestSchema.shape[field], t('errors.number'))}
            >
              <InputNumber
                className="w-full!"
                min={0}
                precision={field === 'passengersRequested' ? 0 : 2}
              />
            </Form.Item>
          ))}
        </div>
        <Alert type="info" showIcon message={t('pricingNote')} />
      </Form>
    </Modal>
  )
}
