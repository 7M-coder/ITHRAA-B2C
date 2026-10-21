import { useEffect } from 'react'
import { Alert, Form, Input, InputNumber, Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import type { Asset } from '../../core/types/domain'
import type { CustodyCommand, CustodyDialogAction } from '../types/workflow'
import { custodyText, custodyMoney } from '../validations/schemas'
import { custodyBalance } from '../utils/workflow'
import { fieldRule } from '../../core/validations/schemas'
interface Props {
  asset: Asset
  action?: CustodyDialogAction
  onClose: () => void
  onSave: (command: CustodyCommand) => void
}
/** Records manager receipt and closure or a missing cash amount without an approval cycle. @param props - Selected record and callbacks. @returns Tracking dialog. */
export function CustodyActionForm({ asset, action, onClose, onSave }: Props) {
  const { t } = useTranslation(['custody', 'common'])
  const [form] = Form.useForm<{ note: string; amount: number; returnedAmount: number }>()
  const financial = asset.type === 'Advance'
  const balance = custodyBalance(asset).balance
  useEffect(() => {
    if (action) {
      form.resetFields()
      form.setFieldsValue({ note: '', returnedAmount: Math.max(0, balance) })
    }
  }, [action, asset.id, form, balance])
  return (
    <Modal
      open={!!action}
      title={t(
        action === 'setAmount'
          ? 'wf.actions.setAmount'
          : financial
            ? 'wf.actions.close'
            : 'wf.returnAsset'
      )}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('wf.save')}
      cancelText={t('wf.cancel')}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) =>
          onSave(
            action === 'setAmount'
              ? { type: 'setAmount', id: asset.id, amount: v.amount }
              : {
                  type: 'close',
                  id: asset.id,
                  note: v.note,
                  returnedAmount: financial ? v.returnedAmount : 0
                }
          )
        }
      >
        {action === 'setAmount' && financial && (
          <Form.Item name="amount" label={t('wf.amount')} rules={[fieldRule(custodyMoney, t)]}>
            <InputNumber className="w-full!" min={0.01} precision={2} />
          </Form.Item>
        )}
        {action !== 'setAmount' && financial && (
          <>
            <Alert className="mb-4" type="info" message={t('wf.closeHint')} />
            <Form.Item
              name="returnedAmount"
              label={t('wf.totals.returned')}
              rules={[{ required: true }]}
            >
              <InputNumber
                aria-label={t('wf.totals.returned')}
                className="w-full!"
                min={0}
                precision={2}
              />
            </Form.Item>
            {balance < 0 && <Alert className="mb-4" type="warning" message={t('wf.overspend')} />}
          </>
        )}
        {action !== 'setAmount' && (
          <Form.Item name="note" label={t('wf.note')} rules={[fieldRule(custodyText, t)]}>
            <Input.TextArea aria-label={t('wf.note')} rows={3} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
