import { useState } from 'react'
import { Alert, App, Button, Card, Input, Select, Segmented, Table, Tabs, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDemoStore, useStorageStatus } from '../../core/hooks/useDemoStore'
import { PageHeader } from '../../core/components/PageHeader'
import { isoDate, money } from '../../core/utils/domain'
import { AssetForm } from '../components/AssetForm'
import { InventoryForm } from '../components/InventoryForm'
import { CustodyDetails } from '../components/CustodyDetails'
import { custodyBalance, inventoryAvailable, getCustodyStatus } from '../utils/workflow'
import type { CustodyActor, CustodyCommand } from '../types/workflow'
/** Shares custody records between manager and employee demo views without simulating real authentication. @returns Custody workspace. */
export default function CustodyPage() {
  const { t, i18n } = useTranslation('custody')
  const { message } = App.useApp()
  const employees = useDemoStore((s) => s.employees)
  const assets = useDemoStore((s) => s.assets)
  const inventory = useDemoStore((s) => s.inventory)
  const run = useDemoStore((s) => s.custodyAction)
  const storageError = useStorageStatus((s) => s.error)
  const [role, setRole] = useState<CustodyActor['role']>('manager')
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '')
  const [selected, setSelected] = useState<string>()
  const [createOpen, setCreateOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [tab, setTab] = useState('custodies')
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<string>()
  const [phase, setPhase] = useState<string>()
  const [employeeFilter, setEmployeeFilter] = useState<string>()
  const actor: CustodyActor = role === 'manager' ? { role } : { role, employeeId }
  const visible = assets.filter((a) => role === 'manager' || a.employeeId === employeeId)
  const filtered = visible.filter(
    (a) =>
      (!kind || (a.type === 'Advance' ? 'financial' : 'physical') === kind) &&
      (!phase || getCustodyStatus(a) === phase) &&
      (role !== 'manager' || !employeeFilter || a.employeeId === employeeFilter) &&
      `${a.description} ${a.serialNumber} ${employees.find((e) => e.id === a.employeeId)?.fullName ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  const execute = (command: CustodyCommand): boolean => {
    try {
      run(command, actor)
      if (useStorageStatus.getState().error) void message.warning(t('wf.storageError'))
      else void message.success(t('wf.saved'))
      return true
    } catch (error) {
      const key = error instanceof Error ? error.message : 'invalid'
      void message.error(t(`wf.errors.${key}`, { defaultValue: t('wf.errors.invalid') }))
      return false
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        title={t('custody')}
        description={t('wf.intro')}
        action={
          role === 'manager' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t('wf.create')}
            </Button>
          ) : undefined
        }
      />
      <Alert type="info" showIcon message={t('wf.demoRoleHint')} />
      {storageError && <Alert type="warning" showIcon message={t('wf.storageError')} />}
      <Card size="small">
        <div className="flex flex-wrap items-center gap-4">
          <Segmented
            aria-label={t('wf.viewAs')}
            value={role}
            onChange={(v) => {
              setRole(v as CustodyActor['role'])
              setSelected(undefined)
            }}
            options={[
              { value: 'manager', label: t('wf.manager') },
              { value: 'employee', label: t('wf.employeeView') }
            ]}
          />
          {role === 'employee' && (
            <Select
              className="w-full sm:w-72"
              aria-label={t('wf.employee')}
              value={employeeId || undefined}
              onChange={(id) => {
                setEmployeeId(id)
                setSelected(undefined)
              }}
              options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
            />
          )}
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        {(['openCount', 'closedCount', 'overdueCount'] as const).map((key) => (
          <Card key={key} size="small">
            <p className="m-0 text-muted">{t(`wf.${key}`)}</p>
            <p className="mb-0 mt-2 text-2xl font-bold">
              {
                visible.filter((a) =>
                  key === 'openCount'
                    ? getCustodyStatus(a) === 'open'
                    : key === 'closedCount'
                      ? getCustodyStatus(a) === 'closed'
                      : getCustodyStatus(a) === 'open' &&
                        a.workflow?.dueDate &&
                        a.workflow.dueDate < isoDate()
                ).length
              }
            </p>
          </Card>
        ))}
      </div>
      <Card>
        <Tabs
          activeKey={role === 'manager' ? tab : 'custodies'}
          onChange={setTab}
          items={[
            {
              key: 'custodies',
              label: t('wf.custodyList'),
              children: (
                <div>
                  <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      aria-label={t('wf.search')}
                      placeholder={t('wf.search')}
                      prefix={<SearchOutlined />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Select
                      aria-label={t('wf.kind')}
                      allowClear
                      placeholder={t('wf.kind')}
                      value={kind}
                      onChange={setKind}
                      options={['financial', 'physical'].map((value) => ({
                        value,
                        label: t(`wf.${value}`)
                      }))}
                    />
                    <Select
                      aria-label={t('wf.status')}
                      allowClear
                      placeholder={t('wf.status')}
                      value={phase}
                      onChange={setPhase}
                      options={['open', 'closed'].map((value) => ({
                        value,
                        label: t(`wf.statuses.${value}`)
                      }))}
                    />
                    {role === 'manager' && (
                      <Select
                        aria-label={t('wf.employee')}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder={t('wf.employee')}
                        value={employeeFilter}
                        onChange={setEmployeeFilter}
                        options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
                      />
                    )}
                  </div>
                  <Table
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 850 }}
                    dataSource={filtered}
                    columns={[
                      { title: t('wf.purpose'), dataIndex: 'description' },
                      {
                        title: t('wf.employee'),
                        render: (_, a) => employees.find((e) => e.id === a.employeeId)?.fullName
                      },
                      {
                        title: t('wf.kind'),
                        render: (_, a) => (
                          <Tag>{t(a.type === 'Advance' ? 'wf.financial' : 'wf.physical')}</Tag>
                        )
                      },
                      {
                        title: t('wf.status'),
                        render: (_, a) => (
                          <Tag color={getCustodyStatus(a) === 'closed' ? 'green' : 'cyan'}>
                            {t(`wf.statuses.${getCustodyStatus(a)}`)}
                          </Tag>
                        )
                      },
                      {
                        title: t('wf.amount'),
                        render: (_, a) =>
                          a.workflow?.amount ? money(a.workflow.amount, i18n.language) : '—'
                      },
                      {
                        title: t('wf.totals.entered'),
                        render: (_, a) =>
                          a.type === 'Advance' && a.workflow
                            ? money(custodyBalance(a).entered, i18n.language)
                            : '—'
                      },
                      { title: t('wf.dueDate'), render: (_, a) => a.workflow?.dueDate || '—' },
                      {
                        title: t('wf.details'),
                        render: (_, a) => (
                          <Button onClick={() => setSelected(a.id)}>{t('wf.details')}</Button>
                        )
                      }
                    ]}
                  />
                </div>
              )
            },
            ...(role === 'manager'
              ? [
                  {
                    key: 'inventory',
                    label: t('wf.inventory'),
                    children: (
                      <div>
                        <Button
                          className="mb-4"
                          icon={<PlusOutlined />}
                          onClick={() => setInventoryOpen(true)}
                        >
                          {t('wf.addInventory')}
                        </Button>
                        <Table
                          rowKey="id"
                          scroll={{ x: 650 }}
                          dataSource={inventory ?? []}
                          columns={[
                            { title: t('wf.name'), dataIndex: 'name' },
                            {
                              title: t('wf.assetType'),
                              render: (_: unknown, item: NonNullable<typeof inventory>[number]) =>
                                t(`wf.types.${item.type}`)
                            },
                            { title: t('wf.serial'), dataIndex: 'serial' },
                            { title: t('wf.condition'), dataIndex: 'condition' },
                            { title: t('wf.accessories'), dataIndex: 'accessories' },
                            {
                              title: t('wf.status'),
                              render: (_: unknown, item: NonNullable<typeof inventory>[number]) =>
                                t(
                                  item.retired
                                    ? 'wf.retired'
                                    : inventoryAvailable(assets, item)
                                      ? 'wf.available'
                                      : 'wf.assigned'
                                )
                            }
                          ]}
                        />
                      </div>
                    )
                  }
                ]
              : [])
          ]}
        />
      </Card>
      <AssetForm
        open={createOpen && role === 'manager'}
        onClose={() => setCreateOpen(false)}
        onSave={(command) => {
          if (execute(command)) {
            setCreateOpen(false)
            if ('id' in command) setSelected(command.id)
          }
        }}
      />
      <InventoryForm
        open={inventoryOpen && role === 'manager'}
        onClose={() => setInventoryOpen(false)}
        onSave={(item) => {
          if (execute({ type: 'inventory', item })) setInventoryOpen(false)
        }}
      />
      <CustodyDetails
        key={`${selected ?? ''}-${role}-${employeeId}`}
        asset={visible.find((a) => a.id === selected)}
        actor={actor}
        onClose={() => setSelected(undefined)}
        onRun={execute}
      />
    </div>
  )
}
