import { Modal, Table, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import type { HajjPackage, ServiceProvider } from '../types/domain'
import { getPackageDuration } from '../utils/domain'

interface PackageComparisonProps {
  open: boolean
  packages: HajjPackage[]
  providers: ServiceProvider[]
  onClose: () => void
}

/** Compares selected package attributes in a compact table. @param props - Packages and modal state. @returns Comparison modal. */
export function PackageComparison({ open, packages, providers, onClose }: PackageComparisonProps) {
  const { t } = useTranslation('packages')
  const rows = [
    {
      key: 'type',
      label: t('compare.pilgrimType'),
      values: packages.map((item) => t(`values.${item.pilgrimType}`))
    },
    { key: 'season', label: t('fields.season'), values: packages.map((item) => item.season) },
    {
      key: 'provider',
      label: t('fields.provider'),
      values: packages.map(
        (item) => providers.find((provider) => provider.id === item.providerId)?.name ?? '—'
      )
    },
    {
      key: 'price',
      label: t('fields.price'),
      values: packages.map((item) => `${item.price.toLocaleString()} ${item.currency}`)
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
          item.services.accommodation?.map((place) => `${place.name} · ${place.city}`).join('، ') ||
          '—'
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
          Object.keys(item.services)
            .map((key) => t(`services.${key}`))
            .join('، ') || '—'
      )
    },
    {
      key: 'status',
      label: t('fields.status'),
      values: packages.map((item) => <Tag key={item.id}>{t(`values.${item.status}`)}</Tag>)
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
