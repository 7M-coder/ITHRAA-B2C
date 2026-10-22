import { useMemo, useState } from 'react'
import { Alert, App, Button, Card, Input, Space, Table } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/core/components/PageHeader'
import { FlightForm } from '../components/FlightForm'
import { useInputsStore, useInputsStorageStatus } from '../hooks/useInputsStore'
import type { InternationalFlightRequest } from '../types/domain'
import { fieldGroups, segmentFields } from '../utils/fields'

/** Formats missing values without conflating them with zero. @param value - Field value. @returns Display text. */
function display(value: unknown) {
  return value === undefined || value === null || value === ''
    ? '—'
    : typeof value === 'number'
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value)
      : String(value)
}
/** Manages the unified, locally persisted flight bookings. @returns Flights page. */
export default function InternationalFlightsPage() {
  const { t } = useTranslation('inputs')
  const { message, modal } = App.useApp()
  const requests = useInputsStore((state) => state.requests)
  const saveRequest = useInputsStore((state) => state.saveRequest)
  const deleteRequest = useInputsStore((state) => state.deleteRequest)
  const storageError = useInputsStorageStatus((state) => state.error)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<InternationalFlightRequest>()
  const [open, setOpen] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const filtered = useMemo(
    () =>
      requests.filter((record) =>
        JSON.stringify(record).toLowerCase().includes(search.trim().toLowerCase())
      ),
    [requests, search]
  )
  const segmentCount = Math.max(1, ...requests.map((record) => record.segments.length))
  const columns: ColumnsType<InternationalFlightRequest> = [
    ...Object.entries(fieldGroups).map(([group, fields]) => ({
      title: t(`groups.${group}`),
      key: group,
      onHeaderCell: () => ({ className: `flight-header-${group}` }),
      children: fields.map((field, fieldIndex) => ({
        title: t(`fields.${field}`),
        key: field,
        dataIndex: field,
        className: fieldIndex === 0 ? 'flight-group-start' : undefined,
        onHeaderCell: () => ({
          className: `flight-header-${group} ${fieldIndex === 0 ? 'flight-group-start' : ''}`
        }),
        width: field === 'notes' ? 240 : 160,
        render: display
      }))
    })),
    ...Array.from({ length: segmentCount }, (_, index) => ({
      title: t('segment', { number: index + 1 }),
      key: `segment-${index}`,
      onHeaderCell: () => ({ className: `flight-header-segment-${index % 3}` }),
      children: segmentFields.map((field, fieldIndex) => ({
        title: t(`fields.${field}`),
        key: `${index}-${field}`,
        className: fieldIndex === 0 ? 'flight-group-start' : undefined,
        onHeaderCell: () => ({
          className: `flight-header-segment-${index % 3} ${fieldIndex === 0 ? 'flight-group-start' : ''}`
        }),
        width: 160,
        render: (_: unknown, record: InternationalFlightRequest) =>
          display(record.segments[index]?.[field])
      }))
    })),
    {
      title: t('actions'),
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            aria-label={t('viewFlight')}
            onClick={() => {
              setEditing(record)
              setReadOnly(true)
              setOpen(true)
            }}
          />
          <Button
            type="text"
            disabled={storageError}
            icon={<EditOutlined />}
            aria-label={t('edit')}
            onClick={() => {
              setEditing(record)
              setReadOnly(false)
              setOpen(true)
            }}
          />
          <Button
            type="text"
            disabled={storageError}
            danger
            icon={<DeleteOutlined />}
            aria-label={t('delete')}
            onClick={() =>
              modal.confirm({
                title: t('deleteConfirm'),
                okText: t('delete'),
                cancelText: t('cancel'),
                onOk: () => {
                  try {
                    deleteRequest(record.id)
                  } catch {
                    void message.error(t('saveError'))
                  }
                }
              })
            }
          />
        </Space>
      )
    }
  ]
  const save = (record: InternationalFlightRequest) => {
    try {
      saveRequest(record)
      if (useInputsStorageStatus.getState().error) throw new Error('storage')
      setOpen(false)
      void message.success(t('saved'))
    } catch {
      void message.error(t('saveError'))
    }
  }
  return (
    <>
      <PageHeader
        title={t('internationalFlights')}
        description={t('flightsDescription')}
        action={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={storageError}
            onClick={() => {
              setEditing(undefined)
              setReadOnly(false)
              setOpen(true)
            }}
          >
            {t('addFlight')}
          </Button>
        }
      />
      <Alert className="mb-5!" type="info" showIcon message={t('demoNote')} />
      {storageError && (
        <Alert className="mb-5!" type="warning" showIcon message={t('storageError')} />
      )}
      <Card>
        <Input.Search
          className="mb-4! max-w-sm"
          placeholder={t('search')}
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="mb-4 text-sm text-muted">{t('count', { count: filtered.length })}</p>
        <Table
          className="flight-groups-table"
          bordered
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: t('emptyFlights') }}
        />
      </Card>
      <FlightForm
        key={`${editing?.id ?? 'new'}-${open}-${readOnly}`}
        open={open}
        request={editing}
        readOnly={readOnly}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  )
}
