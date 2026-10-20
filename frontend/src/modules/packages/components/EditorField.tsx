import { useId, type ReactNode } from 'react'
import type { ZodTypeAny } from 'zod'
import { Form } from 'antd'
import { useTranslation } from 'react-i18next'
import { createPackageFieldRule, packageTextSchema } from '../validations/schemas'
interface Props {
  label: string
  children: ReactNode
  text?: boolean
  schema?: ZodTypeAny
}
/** Connects optional text inputs to reusable safe-text validation. @param props - Field content. @returns Labeled field. */
export function EditorField({ label, children, text = false, schema = packageTextSchema }: Props) {
  const name = useId()
  const { t } = useTranslation('packages')
  return (
    <Form.Item
      label={label}
      name={text ? name : undefined}
      preserve={false}
      getValueProps={text ? () => ({}) : undefined}
      validateTrigger="onBlur"
      rules={text ? [createPackageFieldRule(schema, t)] : undefined}
    >
      {children}
    </Form.Item>
  )
}
