import { Button, Form, Input, InputNumber, Switch } from 'antd'
import type { NamePath } from 'antd/es/form/interface'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import {
  createPackageFieldRule,
  packageTextSchema,
  requiredPackageTextSchema
} from '../validations/schemas'

export interface PackageRowField {
  name: string
  label: string
  numeric?: boolean
  date?: boolean
  toggle?: boolean
}

interface PackageRowListProps {
  name: NamePath
  fields: PackageRowField[]
}

/** Edits a repeatable list of structured package-service rows. @param props - List path and field definitions. @returns Repeatable service form rows. */
export function PackageRowList({ name, fields }: PackageRowListProps) {
  const { t } = useTranslation('packages')
  return (
    <Form.List name={name}>
      {(rows, { add, remove }) => (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="rounded-lg border border-line p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map((field) => (
                  <Form.Item
                    key={field.name}
                    name={[row.name, field.name]}
                    label={t(`fields.${field.label}`)}
                    rules={
                      field.toggle || field.numeric
                        ? undefined
                        : [
                            createPackageFieldRule(
                              field.name === fields[0]?.name
                                ? requiredPackageTextSchema
                                : packageTextSchema,
                              t
                            )
                          ]
                    }
                    valuePropName={field.toggle ? 'checked' : 'value'}
                    className="mb-1"
                  >
                    {field.toggle ? (
                      <Switch />
                    ) : field.numeric ? (
                      <InputNumber min={0} className="w-full" />
                    ) : (
                      <Input type={field.date ? 'date' : 'text'} />
                    )}
                  </Form.Item>
                ))}
              </div>
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => remove(row.name)}
              >
                {t('actions.removeRow')}
              </Button>
            </div>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() =>
              add(
                Object.fromEntries(
                  fields.map((field) => [
                    field.name,
                    field.numeric ? null : field.toggle ? false : ''
                  ])
                )
              )
            }
            block
          >
            {t('actions.addRow')}
          </Button>
        </div>
      )}
    </Form.List>
  )
}
