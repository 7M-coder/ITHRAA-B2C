import { Link } from 'react-router-dom'
import { Button, Card, Empty, Table, Tag } from 'antd'
import {
  TeamOutlined,
  PieChartOutlined,
  InboxOutlined,
  IdcardOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../core/components/PageHeader'
import { StatCard } from '../../core/components/StatCard'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { daysUntil, formatDate } from '../../core/utils/domain'
import { WorkforceChart } from '../components/WorkforceChart'
import { AssetChart } from '../components/AssetChart'
/** Summarizes live demo data and actionable document/custody issues. @returns Dashboard. */
export default function DashboardPage() {
  const { t, i18n } = useTranslation(['dashboard', 'common'])
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'ar'
  const employees = useDemoStore((s) => s.employees)
  const assets = useDemoStore((s) => s.assets)
  const active = employees.filter((e) => e.employmentStatus !== 'Terminated')
  const saudi = active.filter((e) => e.nationality === 'Saudi').length
  const percentage = active.length ? (saudi / active.length) * 100 : 0
  const urgent = employees
    .filter((e) => daysUntil(e.idExpiryDate) <= 30)
    .sort((a, b) => a.idExpiryDate.localeCompare(b.idExpiryDate))
  const pending = employees.filter(
    (e) =>
      e.employmentStatus === 'Terminated' &&
      assets.some((a) => a.employeeId === e.id && a.status !== 'Returned')
  )
  return (
    <>
      <PageHeader
        title={t('dashboard')}
        description={t('dashboardDesc')}
        action={
          <Link to={`/${language}/employees`}>
            <Button icon={<TeamOutlined />}>{t('employees')}</Button>
          </Link>
        }
      />
      <div className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('activeEmployees')}
          value={active.length}
          detail={t('activeOnly')}
          icon={<TeamOutlined />}
        />
        <StatCard
          title={t('saudization')}
          value={
            <span className={percentage >= 50 ? 'text-[#008186]' : 'text-amber-700'}>
              {percentage.toFixed(0)}%
            </span>
          }
          detail={t('saudiShare')}
          icon={<PieChartOutlined />}
          warning={percentage < 50}
        />
        <StatCard
          title={t('activeAssets')}
          value={assets.filter((a) => a.status === 'Active').length}
          detail={t('inUse')}
          icon={<InboxOutlined />}
        />
        <StatCard
          title={t('expiringDocs')}
          value={urgent.length}
          detail={t('within30')}
          icon={<IdcardOutlined />}
          warning
        />
      </div>
      <div className="mb-7 grid gap-5 xl:grid-cols-2">
        <Card
          title={t('workforce')}
          extra={<span className="text-xs text-muted">{t('activeOnly')}</span>}
        >
          <p className="m-0 text-xs text-muted">{t('byNationality')}</p>
          <WorkforceChart saudi={saudi} other={active.length - saudi} />
        </Card>
        <Card title={t('assetDistribution')}>
          <p className="m-0 text-xs text-muted">{t('allStatuses')}</p>
          <AssetChart assets={assets} />
        </Card>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={
            <span>
              {t('urgent')} <Tag color="gold">{urgent.length}</Tag>
            </span>
          }
          extra={<Link to={`/${language}/employees`}>{t('viewAll')}</Link>}
        >
          <p className="mb-5 mt-0 text-xs text-muted">{t('urgentDesc')}</p>
          <Table
            rowKey="id"
            dataSource={urgent}
            scroll={{ x: 580 }}
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            columns={[
              {
                title: t('name'),
                dataIndex: 'fullName',
                render: (v) => <span className="font-bold">{v}</span>
              },
              {
                title: t('document'),
                dataIndex: 'nationality',
                render: (v) => t(v === 'Saudi' ? 'nationalDocument' : 'residenceDocument')
              },
              {
                title: t('idExpiryDate'),
                dataIndex: 'idExpiryDate',
                render: (v) => (
                  <div>
                    <span className="block text-xs">{formatDate(v, language)}</span>
                    <Tag className="mt-1!" color={daysUntil(v) < 0 ? 'error' : 'warning'}>
                      {t(daysUntil(v) < 0 ? 'expired' : 'soon')}
                    </Tag>
                  </div>
                )
              },
              {
                key: 'review',
                render: () => (
                  <Link to={`/${language}/employees`}>
                    <Button type="text" size="small">
                      {t('review')}
                    </Button>
                  </Link>
                )
              }
            ]}
          />
        </Card>
        <Card title={t('pending')}>
          <p className="mb-5 mt-0 text-xs leading-6 text-muted">{t('pendingDesc')}</p>
          {!pending.length ? (
            <Empty description={t('noPending')} />
          ) : (
            pending.map((e) => {
              const unsettled = assets.filter(
                (a) => a.employeeId === e.id && a.status !== 'Returned'
              )
              return (
                <div key={e.id} className="mb-4 rounded-xl border border-line p-4">
                  <div className="mb-2 font-bold">{e.fullName}</div>
                  <div className="mb-4 text-xs leading-6 text-muted">
                    {unsettled.length} {t('assets')} ·{' '}
                    {Array.from(new Set(unsettled.map((a) => t(a.type)))).join('، ')}
                  </div>
                  <Link
                    to={`/${language}/clearance?employee=${e.id}`}
                    className="flex items-center justify-between text-sm"
                  >
                    {t('review')}
                    {language === 'ar' ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
                  </Link>
                </div>
              )
            })
          )}
        </Card>
      </div>
    </>
  )
}
