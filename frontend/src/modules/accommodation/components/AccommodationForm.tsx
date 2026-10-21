import dayjs from 'dayjs'
import { ContractDateInput } from './ContractDateInput'
import { useState } from 'react'
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Radio } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Accommodation } from '../types/domain'
import {
  accommodationFields,
  accommodationRules,
  accommodationWriteSchema,
  accommodationDateRules
} from '../validations/schemas'
import { roomTotal, roomTypes } from '../utils/rooms'
interface Props {
  record?: Accommodation
  onClose: () => void
  onSave: (record: Accommodation) => void
}
/** Edits a housing record and its complete contract. @param props - Selected record and callbacks. @returns Housing dialog. */
export function AccommodationForm({ record, onClose, onSave }: Props) {
  const { t } = useTranslation('accommodation')
  const [form] = Form.useForm<Accommodation>()
  const [errors, setErrors] = useState<string[]>([])
  const city = Form.useWatch('city', form)
  const catering = Form.useWatch('catering', form)
  const rooms = Form.useWatch('rooms', form)
  const capacity = Form.useWatch('capacity', form)
  const contractStart = Form.useWatch('contractStart', form)
  const contractEnd = Form.useWatch('contractEnd', form)
  const periods: Accommodation['periods'] | undefined = Form.useWatch('periods', form)
  const dateDependencies = [
    ['contractStart'],
    ['contractEnd'],
    ...(periods ?? []).flatMap((_, index) => [
      ['periods', index, 'start'],
      ['periods', index, 'end']
    ])
  ]
  const dateMessages = {
    invalid: t('invalid'),
    range: t('errors.dateRange'),
    coverage: t('errors.coverage'),
    order: t('errors.periodOrder')
  }
  const rules = (schema: Parameters<typeof accommodationRules>[0]) =>
    accommodationRules(schema, t('invalid'))
  const submit = (values: Accommodation) => {
    const result = accommodationWriteSchema.safeParse({
      ...values,
      id: record?.id ?? crypto.randomUUID()
    })
    if (!result.success) {
      setErrors([
        ...new Set(
          result.error.issues.map((i) =>
            t(
              'errors.' +
                (['capacity', 'range', 'coverage', 'required', 'priceRequired'].includes(i.message)
                  ? i.message
                  : 'invalid')
            )
          )
        )
      ])
      return
    }
    setErrors([])
    onSave(result.data)
  }
  return (
    <Modal
      open
      title={t(record ? 'edit' : 'add')}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('save')}
      cancelText={t('cancel')}
      width={900}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={
          record ?? {
            rooms: { double: 0, triple: 0, quadruple: 0, suites: 0 },
            catering: false,
            periods: [{}]
          }
        }
      >
        <Form.Item name="city" label={t('city')} rules={rules(accommodationFields.shape.city)}>
          <Select options={['makkah', 'madinah'].map((value) => ({ value, label: t(value) }))} />
        </Form.Item>
        {city && (
          <>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item
                name="name"
                label={t('name')}
                rules={rules(accommodationFields.shape.name)}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="classification"
                label={t('classification')}
                rules={rules(accommodationFields.shape.classification)}
              >
                <Select
                  options={['unclassified', '1', '2', '3', '4', '5', 'licensed'].map((value) => ({
                    value,
                    label: t('ratings.' + value)
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="capacity"
                label={t('capacity')}
                rules={rules(accommodationFields.shape.capacity)}
              >
                <InputNumber className="w-full!" min={1} />
              </Form.Item>
              <Form.Item
                name="unifiedNumber"
                label={t('unifiedNumber')}
                rules={rules(accommodationFields.shape.unifiedNumber)}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
              {roomTypes.map((key) => (
                <Form.Item
                  key={key}
                  name={['rooms', key]}
                  label={t('rooms.' + key)}
                  rules={rules(accommodationFields.shape.rooms.shape[key])}
                >
                  <InputNumber className="w-full!" min={0} />
                </Form.Item>
              ))}
            </div>
            <Alert
              className="mb-4!"
              type={roomTotal(rooms) > capacity ? 'error' : 'info'}
              message={t('inventory', {
                total: roomTotal(rooms),
                remaining: (capacity ?? 0) - roomTotal(rooms)
              })}
            />
            <Form.Item
              name="contractPrice"
              label={t('contractPrice')}
              rules={accommodationRules(
                accommodationFields.shape.contractPrice.unwrap(),
                t('errors.priceRequired')
              )}
            >
              <InputNumber className="w-full!" min={0} precision={2} />
            </Form.Item>
            <div className="grid gap-x-4 sm:grid-cols-2">
              {(['contractStart', 'contractEnd'] as const).map((key) => (
                <Form.Item
                  key={key}
                  name={key}
                  label={t(key)}
                  dependencies={dateDependencies}
                  rules={accommodationDateRules(form.getFieldValue, key, dateMessages)}
                >
                  <ContractDateInput
                    minDate={
                      key === 'contractEnd' && contractStart
                        ? dayjs(contractStart).add(1, 'day').format('YYYY-MM-DD')
                        : undefined
                    }
                    maxDate={
                      key === 'contractStart' && contractEnd
                        ? dayjs(contractEnd).subtract(1, 'day').format('YYYY-MM-DD')
                        : undefined
                    }
                  />
                </Form.Item>
              ))}
            </div>
            <p>{t('periodHelp')}</p>
            <Form.List name="periods">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.key} className="grid items-start gap-x-3 sm:grid-cols-3">
                      <Form.Item
                        name={[field.name, 'start']}
                        label={t('periodStart', { number: index + 1 })}
                        dependencies={dateDependencies}
                        rules={accommodationDateRules(
                          form.getFieldValue,
                          'start',
                          dateMessages,
                          index
                        )}
                      >
                        <ContractDateInput
                          minDate={index > 0 ? periods?.[index - 1]?.end : contractStart}
                          maxDate={
                            contractEnd
                              ? dayjs(contractEnd).subtract(1, 'day').format('YYYY-MM-DD')
                              : undefined
                          }
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'end']}
                        label={t('periodEnd', { number: index + 1 })}
                        dependencies={dateDependencies}
                        rules={accommodationDateRules(
                          form.getFieldValue,
                          'end',
                          dateMessages,
                          index
                        )}
                      >
                        <ContractDateInput
                          minDate={
                            periods?.[index]?.start
                              ? dayjs(periods[index].start).add(1, 'day').format('YYYY-MM-DD')
                              : contractStart
                          }
                          maxDate={contractEnd}
                        />
                      </Form.Item>
                      <Button
                        className="mt-7!"
                        danger
                        disabled={fields.length === 1}
                        onClick={() => remove(field.name)}
                      >
                        {t('removePeriod')}
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() =>
                      add({ start: form.getFieldValue(['periods', fields.length - 1, 'end']) })
                    }
                  >
                    {t('addPeriod')}
                  </Button>
                </div>
              )}
            </Form.List>
            <Form.Item className="mt-5!" name="catering" label={t('catering')}>
              <Radio.Group
                onChange={(e) => {
                  if (!e.target.value) form.setFieldValue('board', undefined)
                }}
                options={[
                  { value: true, label: t('yes') },
                  { value: false, label: t('no') }
                ]}
              />
            </Form.Item>
            {catering && (
              <Form.Item
                name="board"
                label={t('board')}
                rules={rules(accommodationFields.shape.board.unwrap())}
              >
                <Select options={['half', 'full'].map((value) => ({ value, label: t(value) }))} />
              </Form.Item>
            )}
          </>
        )}
        {errors.map((error) => (
          <Alert className="mt-3!" key={error} type="error" showIcon message={error} />
        ))}
      </Form>
    </Modal>
  )
}
