import { DatePicker } from 'antd'
import dayjs from 'dayjs'
interface Props {
  label: string
  minDate?: string
  maxDate?: string
  value: string
  onChange: (value: string) => void
}
/** Provides a consistent localized calendar while storing an ISO calendar date. @param props - Controlled date field. @returns Date picker. */
export function PackageDateInput({ label, value, onChange, minDate, maxDate }: Props) {
  return (
    <DatePicker
      aria-label={label}
      className="w-full"
      format="YYYY-MM-DD"
      defaultPickerValue={minDate ? dayjs(minDate) : undefined}
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
      value={value ? dayjs(value) : null}
      onChange={(date) => onChange(date ? date.format('YYYY-MM-DD') : '')}
    />
  )
}
