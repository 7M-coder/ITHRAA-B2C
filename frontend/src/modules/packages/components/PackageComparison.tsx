import { Modal, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import type { HajjPackage, ServiceProvider } from '../types/domain'
import { financialSummary, editorData } from '../utils/finance'
import { getPackageDuration } from '../utils/domain'

interface PackageComparisonProps {
  open: boolean
  packages: HajjPackage[]
  providers: ServiceProvider[]
  onClose: () => void
}

/** Compares selected package attributes in a compact table. @param props - Packages and modal state. @returns Comparison modal. */
export function PackageComparison({ open, packages, onClose }: PackageComparisonProps) {
  const { t } = useTranslation('packages')
  const rows = [
    { key: 'season', label: t('fields.season'), values: packages.map((item) => item.season) },
    {
      key: 'price',
      label: t('editor.financialSummary'),
      values: packages.map((item) => financialSummary(item, t))
    },
    {
      key: 'duration',
      label: t('fields.duration'),
      values: packages.map(
        (item) => `${getPackageDuration(item.startDate, item.endDate)} ${t('values.days')}`
      )
    },
    {
      key: 'stay',
      label: t('compare.accommodation'),
      values: packages.map(
        (item) =>
          editorData(item)
            .stays.map((place) => `${place.hotel} · ${place.city}`)
            .join('، ') || '—'
      )
    },
    {
      key: 'flight',
      label: t('services.flights'),
      values: packages.map(
        (item) =>
          item.services.flights
            ?.map((flight) => `${flight.origin} ← ${flight.destination}`)
            .join('، ') || '—'
      )
    },
    {
      key: 'services',
      label: t('compare.optionalServices'),
      values: packages.map(
        (item) =>
          editorData(item)
            .services.map((service) => t(`services.${service.category}`))
            .join('، ') || '—'
      )
    },
    {
      key: 'status',
      label: t('fields.status'),
      values: packages.map((item) => t(`values.${item.status}`))
    }
  ]
  return (
    <Modal open={open} onCancel={onClose} title={t('compare.title')} footer={null} width={980}>
      <Table
        size="small"
        pagination={false}
        scroll={{ x: true }}
        rowKey="key"
        dataSource={rows}
        columns={[
          {
            title: t('compare.attribute'),
            dataIndex: 'label',
            key: 'label',
            fixed: 'left',
            width: 170
          },
          ...packages.map((item, index) => ({
            title: item.name,
            key: item.id,
            render: (_: unknown, row: (typeof rows)[number]) => row.values[index]
          }))
        ]}
      />
      <p className="mb-0 mt-3 text-xs text-muted">{t('compare.priceNote')}</p>
    </Modal>
  )
}
