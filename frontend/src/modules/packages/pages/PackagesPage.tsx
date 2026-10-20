import { useMemo, useState } from 'react'
import { App, Button, Card, Input, Select, Space, Table, Tabs } from 'antd'
import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type {
  HajjPackage,
  OperationsBlock,
  PackageStatus,
  ProviderCategory,
  ServiceProvider
} from '../types/domain'
import { usePackageStore, usePackageStorageStatus } from '../hooks/usePackageStore'
import { getPackageDuration } from '../utils/domain'
import { PageHeader } from '@/modules/core/components/PageHeader'
import { useNavigate } from 'react-router-dom'
import { financialSummary } from '../utils/finance'
import { ProviderForm } from '../components/ProviderForm'
import { BlockForm } from '../components/BlockForm'
import { PackagePreview } from '../components/PackagePreview'
import { PackageComparison } from '../components/PackageComparison'

/** Manages local B2C package templates, providers, and compatible operations blocks. @returns Package management page. */
export default function PackagesPage() {
  const { t, i18n } = useTranslation('packages')
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const packages = usePackageStore((state) => state.packages)
  const providers = usePackageStore((state) => state.providers)
  const blocks = usePackageStore((state) => state.blocks)
  const archivePackage = usePackageStore((state) => state.archivePackage)
  const saveProvider = usePackageStore((state) => state.saveProvider)
  const saveBlock = usePackageStore((state) => state.saveBlock)
  const storageError = usePackageStorageStatus((state) => state.error)
  const [activeTab, setActiveTab] = useState('packages')
  const [search, setSearch] = useState('')
  const [seasonFilter, setSeasonFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [selectedIds, setSelectedIds] = useState<React.Key[]>([])
  const [providerDialog, setProviderDialog] = useState(false)
  const [blockDialog, setBlockDialog] = useState(false)
  const [providerToEdit, setProviderToEdit] = useState<ServiceProvider>()
  const [blockToEdit, setBlockToEdit] = useState<OperationsBlock>()
  const [preview, setPreview] = useState<HajjPackage>()
  const [compareOpen, setCompareOpen] = useState(false)
  const selectedPackages = packages.filter((item) => selectedIds.includes(item.id))
  const filteredPackages = useMemo(
    () =>
      packages.filter(
        (item) =>
          item.status !== 'archived' &&
          (!search ||
            `${item.name} ${item.description} ${item.season}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (!seasonFilter || item.season === seasonFilter) &&
          (!statusFilter || item.status === statusFilter)
      ),
    [packages, search, seasonFilter, statusFilter]
  )

  /** Displays a localized message for a failed local store action. @param error - Action error. @returns Nothing. */
  const notifyError = (error: unknown) => {
    const key = error instanceof Error ? error.message : 'invalid'
    void message.error(t(`errors.${key}`, { defaultValue: t('errors.invalid') }))
  }
  const submitProvider = (item: ServiceProvider) => {
    try {
      saveProvider(item)
      setProviderDialog(false)
      void message.success(t('messages.saved'))
    } catch (error) {
      notifyError(error)
    }
  }
  const submitBlock = (item: OperationsBlock) => {
    try {
      saveBlock(item)
      setBlockDialog(false)
      void message.success(t('messages.saved'))
    } catch (error) {
      notifyError(error)
    }
  }
  const startPackage = (item?: HajjPackage) =>
    navigate(
      `/${i18n.language.startsWith('ar') ? 'ar' : 'en'}/packages/${item ? `${item.id}/edit` : 'new'}`
    )
  const startProvider = (item?: ServiceProvider) => {
    setProviderToEdit(item)
    setProviderDialog(true)
  }
  const startBlock = (item?: OperationsBlock) => {
    setBlockToEdit(item)
    setBlockDialog(true)
  }
  const confirmArchive = (item: HajjPackage) =>
    modal.confirm({
      title: t('archive.title'),
      content: t('archive.confirm', { name: item.name }),
      okText: t('actions.archive'),
      cancelText: t('actions.cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        try {
          archivePackage(item.id)
          setSelectedIds((ids) => ids.filter((id) => id !== item.id))
          void message.success(t('messages.archived'))
        } catch (error) {
          notifyError(error)
        }
      }
    })

  const packageColumns: ColumnsType<HajjPackage> = [
    { title: t('fields.name'), dataIndex: 'name', key: 'name', fixed: 'left', width: 190 },
    { title: t('fields.season'), dataIndex: 'season', key: 'season' },

    {
      title: t('editor.financialSummary'),
      key: 'price',
      render: (_, item) => financialSummary(item, t)
    },
    {
      title: t('fields.duration'),
      key: 'duration',
      render: (_, item) => `${getPackageDuration(item.startDate, item.endDate)} ${t('values.days')}`
    },
    {
      title: t('fields.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value: PackageStatus) => <span>{t(`values.${value}`)}</span>
    },
    {
      title: t('table.blocks'),
      key: 'blocks',
      render: (_, item) => blocks.filter((block) => block.packageId === item.id).length
    },
    {
      title: t('table.actions'),
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, item) => (
        <Space size="small">
          <Button
            aria-label={t('actions.preview')}
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setPreview(item)}
          />
          <Button
            aria-label={t('actions.edit')}
            type="text"
            icon={<EditOutlined />}
            onClick={() => startPackage(item)}
          />
          <Button
            aria-label={t('actions.archive')}
            type="text"
            danger
            onClick={() => confirmArchive(item)}
          >
            {t('actions.archive')}
          </Button>
        </Space>
      )
    }
  ]
  const selection: TableProps<HajjPackage>['rowSelection'] = {
    selectedRowKeys: selectedIds,
    onChange: (keys) => setSelectedIds(keys)
  }

  const providerColumns: ColumnsType<ServiceProvider> = [
    { title: t('provider.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('provider.categories'),
      dataIndex: 'categories',
      key: 'categories',
      render: (items: ProviderCategory[]) =>
        items.map((category) => t(`provider.categoriesList.${category}`)).join('، ')
    },
    {
      title: t('provider.active'),
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => <span>{t(active ? 'values.active' : 'values.inactive')}</span>
    },
    {
      title: t('table.actions'),
      key: 'actions',
      render: (_, item) => (
        <Button icon={<EditOutlined />} onClick={() => startProvider(item)}>
          {t('actions.edit')}
        </Button>
      )
    }
  ]
  const blockColumns: ColumnsType<OperationsBlock> = [
    { title: t('block.code'), dataIndex: 'code', key: 'code' },
    { title: t('block.name'), dataIndex: 'name', key: 'name' },
    { title: t('fields.season'), dataIndex: 'season', key: 'season' },
    {
      title: t('block.package'),
      key: 'package',
      render: (_, item) =>
        packages.find((pkg) => pkg.id === item.packageId)?.name ?? t('block.noPackage')
    },
    {
      title: t('table.actions'),
      key: 'actions',
      render: (_, item) => (
        <Button icon={<EditOutlined />} onClick={() => startBlock(item)}>
          {t('actions.edit')}
        </Button>
      )
    }
  ]

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => startPackage()}>
            {t('actions.createPackage')}
          </Button>
        }
      />
      {storageError && (
        <Card className="mb-5 border-amber-300! bg-amber-50! text-amber-900!">
          {t('messages.storageError')}
        </Card>
      )}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'packages',
            label: t('tabs.packages'),
            children: (
              <Card>
                <div className="mb-5 flex flex-wrap gap-3">
                  <Input
                    className="min-w-52 max-w-80"
                    prefix={<SearchOutlined />}
                    placeholder={t('filters.search')}
                    allowClear
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <Select
                    className="min-w-36"
                    allowClear
                    placeholder={t('fields.season')}
                    value={seasonFilter}
                    onChange={setSeasonFilter}
                    options={[...new Set(packages.map((item) => item.season))].map((value) => ({
                      value,
                      label: value
                    }))}
                  />
                  <Select
                    className="min-w-36"
                    allowClear
                    placeholder={t('fields.status')}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={(['draft', 'available', 'paused'] as const).map((value) => ({
                      value,
                      label: t(`values.${value}`)
                    }))}
                  />
                  <Button
                    icon={<SwapOutlined />}
                    disabled={selectedPackages.length < 2}
                    onClick={() => setCompareOpen(true)}
                  >
                    {t('actions.compare')}
                  </Button>
                </div>
                {providers.filter((provider) => provider.active).length === 0 && (
                  <p className="mb-4 text-sm text-muted">{t('messages.addProviderFirst')}</p>
                )}
                <Table<HajjPackage>
                  rowKey="id"
                  columns={packageColumns}
                  dataSource={filteredPackages}
                  rowSelection={selection}
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                  locale={{ emptyText: t('values.noPackages') }}
                />
              </Card>
            )
          },
          {
            key: 'providers',
            label: t('tabs.providers'),
            children: (
              <Card
                title={t('provider.heading')}
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => startProvider()}>
                    {t('provider.create')}
                  </Button>
                }
              >
                <Table<ServiceProvider>
                  rowKey="id"
                  columns={providerColumns}
                  dataSource={providers}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                  locale={{ emptyText: t('provider.empty') }}
                />
              </Card>
            )
          },
          {
            key: 'blocks',
            label: t('tabs.blocks'),
            children: (
              <Card
                title={t('block.heading')}
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => startBlock()}>
                    {t('block.create')}
                  </Button>
                }
              >
                <p className="mb-4 text-sm text-muted">{t('block.liveLinkNote')}</p>
                <Table<OperationsBlock>
                  rowKey="id"
                  columns={blockColumns}
                  dataSource={blocks}
                  scroll={{ x: 800 }}
                  pagination={{ pageSize: 8, hideOnSinglePage: true }}
                  locale={{ emptyText: t('block.empty') }}
                />
              </Card>
            )
          }
        ]}
      />
      <ProviderForm
        open={providerDialog}
        initial={providerToEdit}
        onCancel={() => setProviderDialog(false)}
        onSave={submitProvider}
      />
      <BlockForm
        open={blockDialog}
        initial={blockToEdit}
        packages={packages}
        providers={providers}
        onCancel={() => setBlockDialog(false)}
        onSave={submitBlock}
      />
      <PackagePreview
        item={preview}
        provider={providers.find((provider) => provider.id === preview?.providerId)}
        open={Boolean(preview)}
        onClose={() => setPreview(undefined)}
      />
      <PackageComparison
        open={compareOpen}
        packages={selectedPackages}
        providers={providers}
        onClose={() => setCompareOpen(false)}
      />
    </>
  )
}
