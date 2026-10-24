import { Alert, Collapse, Descriptions, Table } from 'antd'
import { useTranslation } from 'react-i18next'
interface Props {
  data?: Record<string, unknown>
}
/** Shows archived values for manual review without treating them as current prices. @param props - Historical booking data. @returns Translated history panel or nothing. */
export function FlightHistory({ data }: Props) {
  const { t } = useTranslation('inputs')
  if (!data) return null
  const segments = Array.isArray(data.segments)
    ? data.segments.filter(
        (leg): leg is Record<string, unknown> => Boolean(leg) && typeof leg === 'object'
      )
    : []
  const fields = [
    'flightNumber',
    'travelDate',
    'departureDateH',
    'from',
    'to',
    'departureTime',
    'arrivalTime',
    'arrivalDayOffset',
    'capacity'
  ]
  return (
    <Collapse
      className="mb-6!"
      items={[
        {
          key: 'history',
          label: t('history.title'),
          children: (
            <>
              <Alert className="mb-4!" type="warning" showIcon message={t('history.note')} />
              <Descriptions
                column={1}
                bordered
                items={Object.entries(data)
                  .filter(([key]) => key !== 'id' && key !== 'segments')
                  .map(([key, value]) => ({
                    key,
                    label: t(`history.fields.${key}`, {
                      defaultValue: t(`fields.${key}`, { defaultValue: t('history.sourceValue') })
                    }),
                    children: String(value ?? '—')
                  }))}
              />
              {segments.length > 0 && (
                <Table
                  className="mt-4!"
                  rowKey={(row, index) => String(row.id ?? index)}
                  bordered
                  size="small"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  dataSource={segments}
                  columns={fields.map((field) => ({
                    title: t(`fields.${field}`),
                    dataIndex: field,
                    key: field,
                    width: 160,
                    render: (value: unknown) => String(value ?? '—')
                  }))}
                />
              )}
            </>
          )
        }
      ]}
    />
  )
}
