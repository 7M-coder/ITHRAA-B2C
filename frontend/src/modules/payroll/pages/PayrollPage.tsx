import { useState } from 'react'
import { Alert, Button, Card, Input, Table } from 'antd'
import { DownloadOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { PageHeader } from '../../core/components/PageHeader'
import { StatCard } from '../../core/components/StatCard'
import { isoDate, money, payroll } from '../../core/utils/domain'
import { payrollCsv, downloadPayroll } from '../utils/csv'
/** Reviews current payroll and exports a safe demo CSV. @returns Payroll page. */
export default function PayrollPage() {
  const { t, i18n } = useTranslation(['payroll', 'common'])
  const employees = useDemoStore((s) => s.employees)
  const [month, setMonth] = useState(isoDate().slice(0, 7))
  const rows = employees
    .filter((e) => e.employmentStatus !== 'Terminated')
    .map((e) => ({ ...e, ...payroll(e) }))
  const totals = rows.reduce(
    (s, e) => ({
      gross: s.gross + e.gross,
      deductions: s.deductions + e.deductions,
      net: s.net + e.net
    }),
    { gross: 0, deductions: 0, net: 0 }
  )
  return (
    <>
      <PageHeader
        title={t('payroll')}
        description={t('payrollDesc')}
        action={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            disabled={!rows.length || !month}
            onClick={() =>
              downloadPayroll(
                payrollCsv(
                  employees,
                  ['name', 'nationalId', 'bankIban', 'currency', 'gross', 'deductions', 'net'].map(
                    (k) => t(k)
                  )
                ),
                month
              )
            }
          >
            {t('export')}
          </Button>
        }
      />
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <StatCard
          title={t('payrollPeople')}
          value={rows.length}
          icon={<TeamOutlined />}
          detail={t('activeOnly')}
        />
        <StatCard
          title={t('netTotal')}
          value={money(totals.net, i18n.language)}
          icon={<WalletOutlined />}
          detail={t('currentSnapshot')}
        />
      </div>
      <Alert className="mb-5!" showIcon type="info" message={t('payrollNotice')} />
      {rows.some((e) => !e.bankIban) && (
        <Alert className="mb-5!" type="warning" message={t('missingIban')} />
      )}
      <Card>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label htmlFor="payroll-month">{t('month')}</label>
          <Input
            className="w-48!"
            id="payroll-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={rows}
          scroll={{ x: 850 }}
          columns={[
            { title: t('name'), dataIndex: 'fullName' },
            {
              title: t('bankIban'),
              dataIndex: 'bankIban',
              render: (v) => (
                <span className="font-mono text-xs" dir="ltr">
                  {v || '—'}
                </span>
              )
            },
            ...(['gross', 'deductions', 'net'] as const).map((key) => ({
              title: t(key),
              dataIndex: key,
              render: (v: number) => (
                <span className={key === 'net' ? 'font-bold text-[#008186]' : ''}>
                  {money(v, i18n.language)}
                </span>
              )
            }))
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <strong>{t('total')}</strong>
              </Table.Summary.Cell>
              {(['gross', 'deductions', 'net'] as const).map((key, i) => (
                <Table.Summary.Cell key={key} index={i + 2}>
                  <strong>{money(totals[key], i18n.language)}</strong>
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          )}
        />
      </Card>
    </>
  )
}
