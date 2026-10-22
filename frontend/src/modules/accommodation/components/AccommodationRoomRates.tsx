import { Form, InputNumber, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import { roomTypes } from '../utils/rooms'
import { accommodationFields, accommodationRules, housingMoneySchema } from '../validations/schemas'
/** Edits inventory and untaxed rates in a room-type table within the housing form. @returns Room pricing fields. */
export function AccommodationRoomRates() {
  const { t } = useTranslation('accommodation')
  const form = Form.useFormInstance()
  const rooms = Form.useWatch('rooms', form)
  return (
    <Table
      rowKey="key"
      size="small"
      bordered
      pagination={false}
      scroll={{ x: 640 }}
      dataSource={roomTypes.map((key) => ({ key }))}
      columns={[
        { key: 'type', title: t('pricing.roomType'), render: (_, row) => t('rooms.' + row.key) },
        {
          key: 'count',
          title: t('pricing.roomCount'),
          render: (_, row) => (
            <Form.Item
              className="mb-0!"
              name={['rooms', row.key]}
              rules={accommodationRules(
                accommodationFields.shape.rooms.shape[row.key],
                t('invalid')
              )}
            >
              <InputNumber className="w-full!" min={0} aria-label={t('rooms.' + row.key)} />
            </Form.Item>
          )
        },
        {
          key: 'beds',
          title: t('pricing.bedsPerRoom'),
          render: (_, row) =>
            row.key === 'suites' ? (
              <Form.Item
                className="mb-0!"
                name="suiteBeds"
                normalize={(value) => value ?? undefined}
                dependencies={[['rooms', 'suites']]}
                rules={accommodationRules(
                  (rooms?.suites ?? 0) > 0
                    ? accommodationFields.shape.suiteBeds.unwrap()
                    : accommodationFields.shape.suiteBeds,
                  t('errors.suiteBedsRequired')
                )}
              >
                <InputNumber className="w-full!" min={1} aria-label={t('pricing.suiteBeds')} />
              </Form.Item>
            ) : (
              { double: 2, triple: 3, quadruple: 4 }[row.key]
            )
        },
        {
          key: 'rate',
          title: t('pricing.rateColumn'),
          render: (_, row) => (
            <Form.Item
              className="mb-0!"
              name={['roomRates', row.key]}
              normalize={(value) => value ?? undefined}
              dependencies={[['rooms', row.key]]}
              rules={accommodationRules(
                (rooms?.[row.key] ?? 0) > 0 ? housingMoneySchema : housingMoneySchema.optional(),
                t('errors.rateRequired')
              )}
            >
              <InputNumber
                className="w-full!"
                min={0}
                precision={2}
                aria-label={t('roomRate', { type: t('rooms.' + row.key) })}
              />
            </Form.Item>
          )
        }
      ]}
    />
  )
}
