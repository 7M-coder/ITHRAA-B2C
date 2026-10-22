import { DatePicker, Form, Input, InputNumber, TimePicker } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { flightRequestSchema, flightSegmentSchema, inputRules } from '../validations/schemas'
import { countFields, numericFields } from '../utils/fields'

interface Props {
  field: string
  segmentIndex?: number
  readOnly?: boolean
}
/** Renders one translated, schema-validated booking or segment input. @param props - Field identity and segment index. @returns Form field. */
export function FlightField({ field, segmentIndex, readOnly }: Props) {
  const { t } = useTranslation('inputs')
  const shape =
    segmentIndex === undefined ? flightRequestSchema.innerType().shape : flightSegmentSchema.shape
  const schema = shape[field as keyof typeof shape]
  const date = ['arrivalDate', 'departureDate', 'travelDate'].includes(field)
  const time = ['departureTime', 'arrivalTime'].includes(field)
  return (
    <Form.Item
      name={segmentIndex === undefined ? field : [segmentIndex, field]}
      label={t(`fields.${field}`)}
      rules={schema ? inputRules(schema, t('errors.value')) : []}
      getValueProps={
        date || time
          ? (value: string | undefined) => ({
              value: value ? dayjs(time ? `2000-01-01T${value}` : value) : null
            })
          : undefined
      }
      getValueFromEvent={date || time ? (_value, text: string) => text || undefined : undefined}
    >
      {date ? (
        <DatePicker disabled={readOnly} className="w-full!" format="YYYY-MM-DD" />
      ) : time ? (
        <TimePicker disabled={readOnly} className="w-full!" format="HH:mm" />
      ) : numericFields.has(field) ? (
        <InputNumber
          disabled={readOnly}
          className="w-full!"
          min={0}
          max={field === 'paymentPercentage' ? 100 : undefined}
          precision={countFields.has(field) ? 0 : undefined}
        />
      ) : field === 'notes' ? (
        <Input.TextArea readOnly={readOnly} rows={3} />
      ) : (
        <Input readOnly={readOnly} />
      )}
    </Form.Item>
  )
}
