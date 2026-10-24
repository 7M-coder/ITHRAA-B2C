import { DatePicker, Form, Input, InputNumber, Select, TimePicker } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import {
  flightFields,
  flightSegmentSchema,
  inputRules,
  isEnglishFlightInput,
  englishFlightInputSchema
} from '../validations/schemas'
import { flightReferenceLabel, flightSelectOptions } from '../utils/selectOptions'
import { numericFields } from '../utils/fields'
interface Props {
  field: string
  direction?: 'inbound' | 'outbound'
  segmentIndex?: number
  readOnly?: boolean
}
/** Renders one translated booking or journey field. @param props - Field and optional list index. @returns Validated control. */
export function FlightField({ field, segmentIndex, direction = 'inbound', readOnly }: Props) {
  const { t } = useTranslation('inputs')
  const shape: Record<string, import('zod').ZodTypeAny> =
    segmentIndex === undefined ? flightFields.shape : flightSegmentSchema.shape
  const form = Form.useFormInstance()
  const selected = Form.useWatch(
    segmentIndex === undefined ? field : [direction, segmentIndex, field],
    form
  ) as string | undefined
  const choices = flightSelectOptions[field]
  const date = field === 'arrivalDate' || field === 'departureDate'
  const time = field === 'arrivalTime' || field === 'departureTime'
  return (
    <Form.Item
      name={segmentIndex === undefined ? field : [segmentIndex, field]}
      label={t(`fields.${field}`)}
      rules={
        shape[field]
          ? [
              ...inputRules(shape[field], t('errors.value')),
              ...inputRules(englishFlightInputSchema, t('errors.englishOnly'))
            ]
          : []
      }
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
      ) : field === 'currency' ? (
        <Select
          disabled={readOnly}
          allowClear
          options={['SAR', 'EUR', 'USD'].map((value) => ({
            value,
            label: value
          }))}
        />
      ) : choices ? (
        <Select
          disabled={readOnly}
          allowClear
          showSearch
          optionFilterProp="label"
          onSearch={(search) => {
            if (!isEnglishFlightInput(search))
              form.setFields([
                {
                  name: segmentIndex === undefined ? field : [direction, segmentIndex, field],
                  errors: [t('errors.englishOnly')]
                }
              ])
          }}
          options={[...new Set([...choices, ...(selected ? [selected] : [])])].map((value) => ({
            value,
            label: flightReferenceLabel(field, value)
          }))}
        />
      ) : numericFields.has(field) ? (
        <InputNumber
          readOnly={readOnly}
          changeOnBlur={false}
          className="w-full!"
          min={0}
          precision={field === 'seats' ? undefined : field === 'euroRate' ? 6 : 2}
        />
      ) : field === 'notes' ? (
        <Input.TextArea readOnly={readOnly} rows={3} />
      ) : (
        <Input readOnly={readOnly} />
      )}
    </Form.Item>
  )
}
