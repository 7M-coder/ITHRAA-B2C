import { Button, Card, Form, Input, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { FlightField } from './FlightField'
import { connectionDefaults } from '../utils/journeys'
import { segmentFields } from '../utils/fields'
interface Props {
  direction: 'inbound' | 'outbound'
  readOnly?: boolean
}
/** Edits a booking flights, each containing departure and arrival. @param props - View mode. @returns Ordered journey controls. */
export function FlightJourney({ direction, readOnly }: Props) {
  const form = Form.useFormInstance()
  const { t } = useTranslation('inputs')
  return (
    <section className="mb-6 space-y-4">
      <h2 className="text-lg font-semibold">{t(`groups.${direction}`)}</h2>
      <Form.List name={direction}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" className="w-full!" size="middle">
            {fields.map(({ key, name }, index) => (
              <Card
                key={key}
                title={t('journeyNumber', { number: index + 1 })}
                extra={
                  !readOnly && (
                    <Space wrap>
                      <Button danger onClick={() => remove(name)}>
                        {t('delete')}
                      </Button>
                    </Space>
                  )
                }
              >
                <Form.Item name={[name, 'id']} hidden>
                  <Input />
                </Form.Item>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
                  {segmentFields.map((field) => (
                    <FlightField
                      key={field}
                      field={field}
                      segmentIndex={name}
                      direction={direction}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </Card>
            ))}
            {!readOnly && (
              <Button
                onClick={() => {
                  const legs = form.getFieldValue(direction) ?? []
                  add({ id: crypto.randomUUID(), ...connectionDefaults(legs.at(-1)) })
                }}
              >
                {t('addFlightLeg')}
              </Button>
            )}
          </Space>
        )}
      </Form.List>
    </section>
  )
}
