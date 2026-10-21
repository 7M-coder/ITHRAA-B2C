import { Button, Card, Empty, Popconfirm, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Asset } from '../../core/types/domain'
import type { CustodyActor, CustodyCommand, Purchase } from '../types/workflow'
import { purchaseCents } from '../utils/workflow'
import { money } from '../../core/utils/domain'
interface Props {
  asset: Asset
  actor: CustodyActor
  onEdit: (purchase: Purchase) => void
  onRun: (command: CustodyCommand) => boolean
}
/** Presents recorded purchases and evidence with employee editing controls. @param props - Custody and role-aware callbacks. @returns Invoice cards. */
export function PurchaseList({ asset, actor, onEdit, onRun }: Props) {
  const { t, i18n } = useTranslation('custody')
  const w = asset.workflow!
  return (
    <div className="space-y-4">
      {!w.purchases.length && <Empty description={t('wf.noPurchases')} />}
      {w.purchases.map((p) => (
        <Card
          key={p.id}
          size="small"
          title={
            <span className="whitespace-normal">
              {p.supplier} · {money(purchaseCents(p) / 100, i18n.language)}
            </span>
          }
        >
          <p className="text-sm text-muted">
            {p.date} · {t('wf.invoiceNumber')}: {p.invoiceNumber || '—'}
          </p>
          <Table
            size="small"
            rowKey={(_, i) => String(i)}
            pagination={false}
            dataSource={p.items}
            scroll={{ x: 400 }}
            columns={[
              { title: t('wf.itemDescription'), dataIndex: 'description' },
              { title: t('wf.quantity'), dataIndex: 'quantity' },
              {
                title: t('wf.unitPrice'),
                render: (_, line) => money(line.unitPrice, i18n.language)
              }
            ]}
          />
          <div className="my-3 flex flex-wrap gap-3">
            {p.attachments.map((file) => (
              <a key={file.id} href={file.data} download={file.name}>
                {file.name}
              </a>
            ))}
          </div>
          {p.missingInvoiceReason && (
            <p>
              {t('wf.missingInvoiceReason')}: {p.missingInvoiceReason}
            </p>
          )}
          {p.reviewNote && (
            <p className="rounded-lg bg-surface p-3">
              {t('wf.reviewNote')}: {p.reviewNote}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {actor.role === 'employee' &&
              actor.employeeId === asset.employeeId &&
              !['closed', 'cancelled'].includes(w.phase) && (
                <>
                  <Button onClick={() => onEdit(p)}>{t('wf.editPurchase')}</Button>
                  <Popconfirm
                    title={t('wf.deletePurchaseConfirm')}
                    onConfirm={() =>
                      onRun({ type: 'deletePurchase', id: asset.id, purchaseId: p.id })
                    }
                    okText={t('wf.confirm')}
                    cancelText={t('wf.cancel')}
                  >
                    <Button danger>{t('wf.deletePurchase')}</Button>
                  </Popconfirm>
                </>
              )}
          </div>
        </Card>
      ))}
    </div>
  )
}
