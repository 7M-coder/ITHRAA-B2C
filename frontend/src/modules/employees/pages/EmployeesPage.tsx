import { useRef, useState } from 'react'
import { Button, Card, Input, Select, Table } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  IdcardOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../core/components/PageHeader'
import { StatCard } from '../../core/components/StatCard'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { daysUntil, formatDate, money } from '../../core/utils/domain'
import type { Employee } from '../../core/types/domain'
import { EmployeeProfile } from '../components/EmployeeProfile'
import { nationalityLabel } from '../utils/profile'
import { EmployeeForm } from '../components/EmployeeForm'
/** Lists all employees, including terminated records. @returns Employee management page. */
export default function EmployeesPage() {
  const { t, i18n } = useTranslation(['employees', 'common'])
  const employees = useDemoStore((s) => s.employees)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const selected = employees.find((e) => e.id === selectedId)
  const [profileId, setProfileId] = useState<string>()
  const profileTrigger = useRef<HTMLElement | null>(null)
  const closeProfile = () => {
    setProfileId(undefined)
    profileTrigger.current?.focus()
  }
  const rows = employees.filter(
    (e) =>
      (filter === 'all' || e.nationality === filter) &&
      `${e.fullName} ${e.nationalId} ${e.jobTitle} ${nationalityLabel(e, t)}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  return (
    <>
      <PageHeader
        title={t('employees')}
        description={t('employeesDesc')}
        action={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedId(undefined)
              setOpen(true)
            }}
          >
            {t('addEmployee')}
          </Button>
        }
      />
      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <StatCard
          title={t('allEmployees')}
          value={employees.length}
          detail={t('recordCount', { count: employees.length })}
          icon={<TeamOutlined />}
        />
        <StatCard
          title={t('expiredDocuments')}
          value={employees.filter((e) => daysUntil(e.idExpiryDate) < 0).length}
          detail={t('urgentDesc')}
          icon={<IdcardOutlined />}
          warning
        />
      </div>
      <Card>
        <div className="mb-5 flex flex-wrap gap-3">
          <Input
            className="max-w-96!"
            prefix={<SearchOutlined className="text-muted" />}
            placeholder={t('searchEmployees')}
            aria-label={t('searchEmployees')}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            className="min-w-36"
            aria-label={t('nationality')}
            value={filter}
            onChange={setFilter}
            options={['all', 'Saudi', 'NonSaudi'].map((value) => ({ value, label: t(value) }))}
          />
        </div>
        <Table<Employee>
          rowKey="id"
          dataSource={rows}
          scroll={{ x: 1150 }}
          pagination={{ pageSize: 7, showSizeChanger: false, hideOnSinglePage: true }}
          locale={{ emptyText: t('noResults') }}
          columns={[
            {
              title: t('name'),
              dataIndex: 'fullName',
              render: (_, e) => (
                <div>
                  <Button
                    type="link"
                    className="h-auto! whitespace-normal! p-0! text-start! font-bold!"
                    aria-label={t('viewProfile', { name: e.fullName })}
                    onClick={(event) => {
                      profileTrigger.current = event.currentTarget
                      setProfileId(e.id)
                    }}
                  >
                    {e.fullName}
                  </Button>
                </div>
              )
            },
            {
              title: t('nationalId'),
              dataIndex: 'nationalId',
              render: (v) => <span dir="ltr">{v}</span>
            },
            {
              title: t('nationality'),
              dataIndex: 'nationality',
              render: (_, e) => <span>{nationalityLabel(e, t)}</span>
            },
            { title: t('jobTitle'), dataIndex: 'jobTitle' },
            {
              title: t('employmentStatus'),
              dataIndex: 'employmentStatus',
              render: (value) => (
                <span className="text-muted">
                  {t(value === 'Terminated' ? 'Terminated' : 'ActiveEmployee')}
                </span>
              )
            },
            {
              title: t('basicSalary'),
              dataIndex: 'basicSalary',
              render: (v) => money(v, i18n.language)
            },
            {
              title: t('idExpiryDate'),
              dataIndex: 'idExpiryDate',
              render: (v) => (
                <span
                  className={daysUntil(v) < 0 ? 'text-red-700 dark:text-red-400' : 'text-muted'}
                >
                  {t(daysUntil(v) < 0 ? 'expiredOn' : 'expiresOn', {
                    date: formatDate(v, i18n.language)
                  })}
                </span>
              )
            },
            {
              title: t('edit'),
              key: 'edit',
              render: (_, e) => (
                <Button
                  type="text"
                  aria-label={`${t('edit')} ${e.fullName}`}
                  icon={<EditOutlined />}
                  onClick={() => {
                    setSelectedId(e.id)
                    setOpen(true)
                  }}
                >
                  {t('edit')}
                </Button>
              )
            }
          ]}
        />
      </Card>
      <EmployeeProfile
        employeeId={profileId}
        onClose={closeProfile}
        onEdit={() => {
          setSelectedId(profileId)
          setOpen(true)
        }}
      />
      <EmployeeForm open={open} employee={selected} onClose={() => setOpen(false)} />
    </>
  )
}
