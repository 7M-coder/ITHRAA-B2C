import { useMemo, useState } from 'react'
import { Alert, App, Button, Card, Input, Modal, Space, Table, Upload } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import readXlsxFile from 'read-excel-file'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/core/components/PageHeader'
import { FlightForm } from '../components/FlightForm'
import { useInputsStore, useInputsStorageStatus } from '../hooks/useInputsStore'
import type { InternationalFlightRequest } from '../types/domain'
import { parseFlightRows, type FlightImportResult } from '../utils/flightImport'

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

/** Manages international flight booking requests in the Emirates workbook layout. @returns International flights page. */
export default function InternationalFlightsPage() {
  const { t } = useTranslation('inputs')
  const { message, modal } = App.useApp()
  const requests = useInputsStore((state) => state.requests)
  const saveRequest = useInputsStore((state) => state.saveRequest)
  const deleteRequest = useInputsStore((state) => state.deleteRequest)
  const importRequests = useInputsStore((state) => state.importRequests)
  const storageError = useInputsStorageStatus((state) => state.error)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<InternationalFlightRequest>()
  const [formOpen, setFormOpen] = useState(false)
  const [pending, setPending] = useState<FlightImportResult>()
  const [importing, setImporting] = useState(false)
  const filtered = useMemo(
    () =>
      requests.filter((request) =>
        `${request.pnr} ${request.arrivalRoute} ${request.departureRoute} ${request.currency}`
          .toLowerCase()
          .includes(search.toLowerCase().trim())
      ),
    [requests, search]
  )

  const columns: ColumnsType<InternationalFlightRequest> = [
    { title: t('fields.pnr'), dataIndex: 'pnr', key: 'pnr', fixed: 'left', width: 105 },
    { title: t('fields.arrivalDate'), dataIndex: 'arrivalDate', key: 'arrivalDate', width: 130 },
    { title: t('fields.arrivalRoute'), dataIndex: 'arrivalRoute', key: 'arrivalRoute', width: 155 },
    {
      title: t('fields.departureDate'),
      dataIndex: 'departureDate',
      key: 'departureDate',
      width: 130
    },
    {
      title: t('fields.departureRoute'),
      dataIndex: 'departureRoute',
      key: 'departureRoute',
      width: 155
    },
    { title: t('fields.currency'), dataIndex: 'currency', key: 'currency', width: 95 },
    ...(
      ['fare', 'otherTaxes', 'farePerPassenger', 'passengersRequested', 'totalFare'] as const
    ).map((field) => ({
      title: t(`fields.${field}`),
      dataIndex: field,
      key: field,
      width: 130,
      render: (value: number) => numberFormat.format(value)
    })),
    {
      title: t('actions'),
      key: 'actions',
      fixed: 'right',
      width: 110,
      render: (_, item) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={t('edit')}
            onClick={() => {
              setEditing(item)
              setFormOpen(true)
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label={t('delete')}
            onClick={() =>
              modal.confirm({
                title: t('deleteConfirm'),
                okText: t('delete'),
                okButtonProps: { danger: true },
                cancelText: t('cancel'),
                onOk: () => deleteRequest(item.id)
              })
            }
          />
        </Space>
      )
    }
  ]

  /** Reads an uploaded request workbook for review. @param file - Selected workbook. @returns False to prevent auto upload. */
  const readFile = async (file: File) => {
    if (file.size > 10_000_000) {
      void message.error(t('fileTooLarge'))
      return false
    }
    setImporting(true)
    try {
      setPending(parseFlightRows(await readXlsxFile(file)))
    } catch (error) {
      void message.error(
        t(
          error instanceof Error && error.message === 'wrongTemplate'
            ? 'wrongTemplate'
            : 'readError'
        )
      )
    } finally {
      setImporting(false)
    }
    return false
  }

  /** Validates and saves a manually entered request. @param request - Submitted request. @returns Nothing. */
  const save = (request: InternationalFlightRequest) => {
    try {
      saveRequest(request)
      if (useInputsStorageStatus.getState().error) throw new Error('storage')
      setFormOpen(false)
      void message.success(t('saved'))
    } catch {
      void message.error(t('saveError'))
    }
  }

  /** Imports reviewed valid requests. @returns Nothing. */
  const confirmImport = () => {
    if (!pending) return
    try {
      importRequests(pending.records)
      if (useInputsStorageStatus.getState().error) throw new Error('storage')
      setPending(undefined)
      void message.success(t('imported', { count: pending.records.length }))
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
          <Space wrap>
            <Upload
              accept=".xlsx"
              showUploadList={false}
              beforeUpload={readFile}
              disabled={importing || storageError}
            >
              <Button icon={<UploadOutlined />} loading={importing}>
                {t('importExcel')}
              </Button>
            </Upload>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={storageError}
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              {t('addFlight')}
            </Button>
          </Space>
        }
      />
      <Alert className="mb-5!" type="info" showIcon message={t('importNote')} />
      {storageError && (
        <Alert className="mb-5!" type="warning" showIcon message={t('storageError')} />
      )}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Input.Search
            className="max-w-sm"
            placeholder={t('search')}
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="text-sm text-muted">{t('count', { count: filtered.length })}</span>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: t('emptyFlights') }}
        />
      </Card>
      <FlightForm
        key={editing?.id ?? 'new'}
        open={formOpen}
        request={editing}
        onClose={() => setFormOpen(false)}
        onSave={save}
      />
      <Modal
        open={Boolean(pending)}
        title={t('reviewImport')}
        onCancel={() => setPending(undefined)}
        onOk={confirmImport}
        okText={t('confirmImport')}
        okButtonProps={{ disabled: !pending?.records.length || storageError }}
        cancelText={t('cancel')}
      >
        <p>{t('validRows', { count: pending?.records.length ?? 0 })}</p>
        <p>{t('invalidRows', { count: pending?.invalidRows.length ?? 0 })}</p>
        {Boolean(pending?.invalidRows.length) && (
          <p className="text-sm text-muted">
            {t('invalidExamples', { rows: pending?.invalidRows.slice(0, 10).join(', ') })}
          </p>
        )}
        <Alert type="info" showIcon message={t('upsertNote')} />
      </Modal>
    </>
  )
}
