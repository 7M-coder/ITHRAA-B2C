import { useState } from 'react'
import { Alert, App, Button, Card, Input, Select, Space, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/core/components/PageHeader'
import {
  useAccommodationStore,
  useAccommodationStorageStatus
} from '../hooks/useAccommodationStore'
import type { Accommodation } from '../types/domain'
import { AccommodationForm } from '../components/AccommodationForm'
import { AccommodationDetails } from '../components/AccommodationDetails'
/** Manages the city housing catalog. @returns Searchable housing page. */
export default function AccommodationPage() {
  const { t } = useTranslation('accommodation')
  const { message } = App.useApp()
  const records = useAccommodationStore((s) => s.records)
  const save = useAccommodationStore((s) => s.saveAccommodation)
  const storageError = useAccommodationStorageStatus((s) => s.error)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState<string>()
  const [editing, setEditing] = useState<Accommodation>()
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<Accommodation>()
  const submit = (record: Accommodation) => {
    try {
      save(record)
      if (useAccommodationStorageStatus.getState().error) throw new Error('storage')
      setOpen(false)
      void message.success(t('saved'))
    } catch {
      void message.error(t('saveError'))
    }
  }
  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        action={
          <Button
            type="primary"
            disabled={storageError}
            onClick={() => {
              setEditing(undefined)
              setOpen(true)
            }}
          >
            {t('add')}
          </Button>
        }
      />
      {storageError && (
        <Alert className="mb-4!" type="warning" showIcon message={t('storageError')} />
      )}
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input.Search
            className="max-w-sm"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          <Select
            className="min-w-48"
            allowClear
            placeholder={t('city')}
            value={city}
            onChange={setCity}
            options={['makkah', 'madinah'].map((value) => ({ value, label: t(value) }))}
          />
        </div>
        <Table<Accommodation>
          rowKey="id"
          scroll={{ x: 850 }}
          locale={{ emptyText: t('empty') }}
          dataSource={records.filter(
            (r) =>
              (!city || r.city === city) &&
              (r.name + ' ' + r.unifiedNumber).toLowerCase().includes(search.trim().toLowerCase())
          )}
          columns={[
            { title: t('name'), dataIndex: 'name' },
            { title: t('city'), render: (_, r) => t(r.city) },
            { title: t('classification'), render: (_, r) => t('ratings.' + r.classification) },
            { title: t('capacity'), dataIndex: 'capacity' },
            { title: t('unifiedNumber'), dataIndex: 'unifiedNumber' },
            {
              title: t('actions'),
              render: (_, r) => (
                <Space>
                  <Button onClick={() => setDetails(r)}>{t('details')}</Button>
                  <Button
                    disabled={storageError}
                    onClick={() => {
                      setEditing(r)
                      setOpen(true)
                    }}
                  >
                    {t('edit')}
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
      {open && (
        <AccommodationForm record={editing} onClose={() => setOpen(false)} onSave={submit} />
      )}
      {details && <AccommodationDetails record={details} onClose={() => setDetails(undefined)} />}
    </>
  )
}
