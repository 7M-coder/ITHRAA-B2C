import { DatePicker } from 'antd'
import dayjs from 'dayjs'
interface Props {
  value?: string
  onChange?: (value: string) => void
  id?: string
  minDate?: string
  maxDate?: string
}
/** Stores a calendar selection as an ISO date without timezone conversion. @param props - Form-controlled value and callback. @returns Date picker. */
export function ContractDateInput({ value, onChange, id, minDate, maxDate }: Props) {
  return (
    <DatePicker
      id={id}
      className="w-full"
      format="YYYY-MM-DD"
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
      value={value ? dayjs(value) : null}
      onChange={(date) => onChange?.(date ? date.format('YYYY-MM-DD') : '')}
    />
  )
}
