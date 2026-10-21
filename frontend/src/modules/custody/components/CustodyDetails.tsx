import { useState } from 'react'
import { Alert, Button, Card, Descriptions, Drawer, Table, Tag, Timeline } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Asset } from '../../core/types/domain'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { money } from '../../core/utils/domain'
import type { CustodyActor, CustodyCommand, CustodyDialogAction, Purchase } from '../types/workflow'
import { custodyBalance, getCustodyWorkflow, getCustodyStatus } from '../utils/workflow'
import { PurchaseForm } from './PurchaseForm'
import { CustodyActionForm } from './CustodyActionForm'
import { PurchaseList } from './PurchaseList'
interface Props {
  asset?: Asset
  actor: CustodyActor
  onClose: () => void
  onRun: (command: CustodyCommand) => boolean
}
/** Shows custody tracking with employee purchase and closure controls. @param props - Selected custody and current demo role. @returns Details drawer. */
export function CustodyDetails({ asset, actor, onClose, onRun }: Props) {
  const { t, i18n } = useTranslation('custody')
  const employees = useDemoStore((s) => s.employees)
  const inventory = useDemoStore((s) => s.inventory)
  const [action, setAction] = useState<CustodyDialogAction>()
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [purchase, setPurchase] = useState<Purchase>()
  if (!asset) return null
  const w = getCustodyWorkflow(asset)
  const financial = asset.type === 'Advance'
  const unit = inventory?.find((i) => i.id === w?.inventoryId)
  const balance = custodyBalance(asset)
  const manager = actor.role === 'manager'
  return (
    <Drawer open width={1050} onClose={onClose} title={asset.description} destroyOnHidden>
      <div className="space-y-5">
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: 'employee',
              label: t('wf.employee'),
              children: employees.find((e) => e.id === asset.employeeId)?.fullName
            },
            {
              key: 'kind',
              label: t('wf.kind'),
              children: t(financial ? 'wf.financial' : 'wf.physical')
            },
            {
              key: 'phase',
              label: t('wf.status'),
              children: <Tag>{t(`wf.statuses.${getCustodyStatus(asset)}`)}</Tag>
            },
            { key: 'due', label: t('wf.dueDate'), children: w?.dueDate || '—' },

            ...(!financial
              ? [
                  {
                    key: 'serial',
                    label: t('wf.serial'),
                    children: asset.serialNumber || unit?.serial || '—'
                  },
                  {
                    key: 'accessories',
                    label: t('wf.accessories'),
                    children: w?.accessoriesAtIssue ?? unit?.accessories ?? '—'
                  }
                ]
              : [])
          ]}
        />
        {!w && financial && asset.status !== 'Returned' && (
          <Alert
            showIcon
            type="info"
            message={t('wf.amountMissing')}
            action={
              manager ? (
                <Button onClick={() => setAction('setAmount')}>{t('wf.actions.setAmount')}</Button>
              ) : undefined
            }
          />
        )}
        {w && (
          <>
            {financial && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(['amount', 'entered', 'returned', 'balance'] as const).map((key) => (
                    <Card key={key} size="small">
                      <p className="m-0 text-sm text-muted">{t(`wf.totals.${key}`)}</p>
                      <p className="mb-0 mt-2 text-xl font-bold">
                        {money(key === 'amount' ? (w.amount ?? 0) : balance[key], i18n.language)}
                      </p>
                    </Card>
                  ))}
                </div>
                {balance.entered > (w.amount ?? 0) && (
                  <Alert type="warning" showIcon message={t('wf.overspend')} />
                )}
                <Alert type="info" showIcon message={t('wf.balanceHint')} />
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {!manager &&
                actor.employeeId === asset.employeeId &&
                !['closed', 'cancelled'].includes(w.phase) && (
                  <>
                    {financial && (
                      <Button
                        onClick={() => {
                          setPurchase(undefined)
                          setPurchaseOpen(true)
                        }}
                      >
                        {t('wf.addPurchase')}
                      </Button>
                    )}
                  </>
                )}
              {manager && !['closed', 'cancelled'].includes(w.phase) && (
                <Button type="primary" onClick={() => setAction('close')}>
                  {t(financial ? 'wf.actions.close' : 'wf.returnAsset')}
                </Button>
              )}
            </div>
            {w.returnNote && (
              <Alert type="info" message={t('wf.requestNote')} description={w.returnNote} />
            )}
            {financial && (
              <Card title={t('wf.purchases')}>
                <PurchaseList
                  asset={asset}
                  actor={actor}
                  onEdit={(p) => {
                    setPurchase(p)
                    setPurchaseOpen(true)
                  }}
                  onRun={onRun}
                />
              </Card>
            )}
            {w.settlements.length > 0 && (
              <Card title={t('wf.settlementMovements')}>
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 480 }}
                  dataSource={w.settlements}
                  columns={[
                    { title: t('wf.kind'), render: (_, s) => t(`wf.movement.${s.kind}`) },
                    { title: t('wf.amount'), render: (_, s) => money(s.amount, i18n.language) },
                    { title: t('wf.note'), dataIndex: 'reference' }
                  ]}
                />
              </Card>
            )}
            <Card title={t('wf.history')}>
              <Timeline
                items={w.history.map((h) => ({
                  children: (
                    <div>
                      <strong>{t(`wf.events.${h.action}`)}</strong>
                      <p className="mb-0 text-sm text-muted">
                        {new Date(h.at).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-GB')}{' '}
                        ·{' '}
                        {h.actor === 'manager'
                          ? t('wf.manager')
                          : employees.find((e) => e.id === h.actor)?.fullName}
                      </p>
                      {h.note && <p>{h.note}</p>}
                    </div>
                  )
                }))}
              />
            </Card>
          </>
        )}
      </div>
      <CustodyActionForm
        asset={asset}
        action={action}
        onClose={() => setAction(undefined)}
        onSave={(command) => {
          if (onRun(command)) setAction(undefined)
        }}
      />
      <PurchaseForm
        open={purchaseOpen}
        initial={purchase}
        minDate={asset.assignedAt}
        onClose={() => setPurchaseOpen(false)}
        onSave={(p) => {
          if (onRun({ type: 'purchase', id: asset.id, purchase: p })) setPurchaseOpen(false)
        }}
      />
    </Drawer>
  )
}
