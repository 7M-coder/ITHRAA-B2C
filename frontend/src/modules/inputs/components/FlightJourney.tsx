import { Button, Card, Form, Input, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { FlightField } from './FlightField'
import { segmentFields } from '../utils/fields'
interface Props {
  direction: 'inbound' | 'outbound'
  readOnly?: boolean
}
/** Edits a direction's first flight and optional onward connections. @param props - Direction and view mode. @returns Ordered journey controls. */
export function FlightJourney({ direction, readOnly }: Props) {
  const { t } = useTranslation('inputs')
  return (
    <section className="mb-6 space-y-4">
      <h2 className="text-lg font-semibold">{t(`groups.${direction}`)}</h2>
      <Form.List name={direction}>
        {(fields, { add, remove, move }) => (
          <Space direction="vertical" className="w-full!" size="middle">
            {fields.map(({ key, name }, index) => (
              <Card
                key={key}
                title={index === 0 ? t('firstFlight') : t('connection', { number: index })}
                extra={
                  !readOnly &&
                  index > 0 && (
                    <Space wrap>
                      <Button onClick={() => move(index, index - 1)}>{t('moveUp')}</Button>
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
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </Card>
            ))}
            {!readOnly && (
              <Button onClick={() => add({ id: crypto.randomUUID() })}>{t('addFlightLeg')}</Button>
            )}
          </Space>
        )}
      </Form.List>
    </section>
  )
}
