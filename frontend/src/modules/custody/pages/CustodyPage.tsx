import { useState } from 'react'
import { App, Button, Card, Empty, Popconfirm, Table, Tag } from 'antd'
import {
  PlusOutlined,
  InboxOutlined,
  WarningOutlined,
  UndoOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { PageHeader } from '../../core/components/PageHeader'
import { StatCard } from '../../core/components/StatCard'
import { formatDate } from '../../core/utils/domain'
import type { Asset } from '../../core/types/domain'
import { AssetForm } from '../components/AssetForm'
/** Shows custody grouped by employee with one-way status transitions. @returns Custody page. */
export default function CustodyPage() {
  const { t, i18n } = useTranslation(['custody', 'common'])
  const { message } = App.useApp()
  const employees = useDemoStore((s) => s.employees)
  const assets = useDemoStore((s) => s.assets)
  const change = useDemoStore((s) => s.changeAssetStatus)
  const [open, setOpen] = useState(false)
  const update = (id: string, status: 'Returned' | 'Lost') => {
    change(id, status)
    void message.success(t('statusUpdated'))
  }
  return (
    <>
      <PageHeader
        title={t('custody')}
        description={t('custodyDesc')}
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            {t('assignAsset')}
          </Button>
        }
      />
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <StatCard
          title={t('activeAssets')}
          value={assets.filter((a) => a.status === 'Active').length}
          icon={<InboxOutlined />}
          detail={t('inUse')}
        />
        <StatCard
          title={t('lostAssets')}
          value={assets.filter((a) => a.status === 'Lost').length}
          icon={<WarningOutlined />}
          detail={t('pendingDesc')}
          warning
        />
      </div>
      <div className="space-y-5">
        {!assets.length && (
          <Card>
            <Empty description={t('noAssets')} />
          </Card>
        )}
        {employees
          .filter((e) => assets.some((a) => a.employeeId === e.id))
          .map((e) => (
            <Card
              key={e.id}
              title={
                <span className="flex items-center gap-3">
                  <UserOutlined className="text-[#008186]" />
                  {e.fullName}
                  <span className="text-xs font-normal text-muted">{e.jobTitle}</span>
                </span>
              }
            >
              <Table<Asset>
                rowKey="id"
                pagination={false}
                scroll={{ x: 850 }}
                dataSource={assets.filter((a) => a.employeeId === e.id)}
                columns={[
                  { title: t('assetType'), dataIndex: 'type', render: (v) => <Tag>{t(v)}</Tag> },
                  { title: t('description'), dataIndex: 'description' },
                  {
                    title: t('serialNumber'),
                    dataIndex: 'serialNumber',
                    render: (v) => <span dir="ltr">{v || '—'}</span>
                  },
                  {
                    title: t('assignedAt'),
                    dataIndex: 'assignedAt',
                    render: (v) => formatDate(v, i18n.language)
                  },
                  {
                    title: t('employmentStatus'),
                    dataIndex: 'status',
                    render: (v) => (
                      <Tag color={v === 'Active' ? 'cyan' : v === 'Lost' ? 'error' : 'default'}>
                        {t(v)}
                      </Tag>
                    )
                  },
                  {
                    key: 'actions',
                    render: (_, a) =>
                      a.status === 'Active' ? (
                        <div className="flex gap-2">
                          <Button
                            size="small"
                            icon={<UndoOutlined />}
                            onClick={() => update(a.id, 'Returned')}
                          >
                            {t('returnAsset')}
                          </Button>
                          <Popconfirm
                            title={t('confirmLost')}
                            onConfirm={() => update(a.id, 'Lost')}
                            okText={t('confirm')}
                            cancelText={t('cancel')}
                          >
                            <Button size="small" danger>
                              {t('loseAsset')}
                            </Button>
                          </Popconfirm>
                        </div>
                      ) : null
                  }
                ]}
              />
            </Card>
          ))}
      </div>
      <AssetForm open={open} onClose={() => setOpen(false)} />
    </>
  )
}
