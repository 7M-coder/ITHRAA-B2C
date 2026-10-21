import { getCustodyStatus } from '../../custody/utils/workflow'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, App, Button, Card, Empty, Select, Table, Tag } from 'antd'
import { SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { PageHeader } from '../../core/components/PageHeader'
import { canClear, formatDate } from '../../core/utils/domain'
/** Reviews leave and custody, then records eligible clearance once. @returns Clearance page. */
export default function ClearancePage() {
  const { t, i18n } = useTranslation(['clearance', 'common', 'custody'])
  const [params] = useSearchParams()
  const [id, setId] = useState(params.get('employee') || '')
  const { message } = App.useApp()
  const employees = useDemoStore((s) => s.employees)
  const assets = useDemoStore((s) => s.assets)
  const clearances = useDemoStore((s) => s.clearances)
  const issue = useDemoStore((s) => s.issueClearance)
  const terminated = employees.filter((e) => e.employmentStatus === 'Terminated')
  const employee = terminated.find((e) => e.id === id)
  const related = assets.filter((a) => a.employeeId === id)
  const issued = clearances.find((c) => c.employeeId === id)
  const eligible = employee && canClear(employee, assets)
  return (
    <>
      <PageHeader title={t('clearance')} description={t('clearanceDesc')} />
      <Card className="mb-6!">
        <label className="mb-2 block font-bold" htmlFor="clearance-employee">
          {t('selectTerminated')}
        </label>
        <Select
          id="clearance-employee"
          className="w-full max-w-md"
          placeholder={t('selectEmployee')}
          value={id || undefined}
          onChange={setId}
          options={terminated.map((e) => ({ value: e.id, label: e.fullName }))}
          notFoundContent={t('noTerminated')}
        />
      </Card>
      {!employee ? (
        <Card className="py-16!">
          <Empty description={t('clearanceEmpty')} />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid items-start gap-5 lg:grid-cols-3">
            <Card title={t('hrReview')}>
              <h2 className="mt-0 text-lg font-bold">{employee.fullName}</h2>
              <p className="text-muted">{employee.jobTitle}</p>
              <Tag>{t('Terminated')}</Tag>
              <div className="mt-6 border-t border-line pt-5">
                <div className="text-sm text-muted">{t('uncompensatedLeaveDays')}</div>
                <div className="my-3 text-3xl font-bold">
                  {employee.uncompensatedLeaveDays || 0}{' '}
                  <span className="text-sm font-normal">{t('days')}</span>
                </div>
                <p className="text-xs leading-6 text-muted">{t('leaveNote')}</p>
              </div>
            </Card>
            <Card className="lg:col-span-2" title={t('custodyReview')}>
              <Table
                rowKey="id"
                pagination={false}
                scroll={{ x: 450 }}
                locale={{ emptyText: t('noAssets') }}
                dataSource={related}
                columns={[
                  { title: t('assetType'), dataIndex: 'type', render: (v) => t(v) },
                  { title: t('description'), dataIndex: 'description' },
                  {
                    title: t('employmentStatus'),
                    dataIndex: 'status',
                    render: (_, asset) => (
                      <Tag color={getCustodyStatus(asset) === 'closed' ? 'success' : 'warning'}>
                        {t(`custody:wf.statuses.${getCustodyStatus(asset)}`)}
                      </Tag>
                    )
                  }
                ]}
              />
            </Card>
          </div>
          <Card>
            {issued ? (
              <Alert
                showIcon
                type="success"
                message={t('issued')}
                description={`${t('issuedNote')} ${t('issuedDate')}: ${formatDate(issued.issuedAt.slice(0, 10), i18n.language)}`}
              />
            ) : (
              <Alert
                showIcon
                type={eligible ? 'success' : 'warning'}
                message={t(eligible ? 'clearanceReady' : 'clearanceBlocked')}
              />
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <p className="m-0 text-xs text-muted">{t('clearanceDemo')}</p>
              <Button
                type="primary"
                icon={issued ? <CheckCircleOutlined /> : <SafetyCertificateOutlined />}
                disabled={!eligible || !!issued}
                onClick={() => {
                  if (issue(id)) void message.success(t('issued'))
                }}
              >
                {t(issued ? 'issued' : 'issue')}
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
