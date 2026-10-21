import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { isoDate } from '../../core/utils/domain'
import { fieldRule } from '../../core/validations/schemas'
import { custodyRequired, custodyMoney, custodyDate } from '../validations/schemas'
import { inventoryAvailable } from '../utils/workflow'
import type { CustodyCommand } from '../types/workflow'
interface Props {
  open: boolean
  onClose: () => void
  onSave: (command: CustodyCommand) => void
}
interface Values {
  employeeId: string
  kind: 'financial' | 'physical'
  description: string
  dueDate: string
  amount: number
  inventoryId: string
}
/** Records a custody as open immediately. @param props - Dialog callbacks. @returns Custody creation form. */
export function AssetForm({ open, onClose, onSave }: Props) {
  const { t } = useTranslation(['custody', 'common'])
  const [form] = Form.useForm<Values>()
  const kind = Form.useWatch('kind', form)
  const employees = useDemoStore((s) => s.employees)
  const assets = useDemoStore((s) => s.assets)
  const inventory = useDemoStore((s) => s.inventory)
  const clearances = useDemoStore((s) => s.clearances)
  const eligible = employees.filter(
    (e) => e.employmentStatus !== 'Terminated' && !clearances.some((c) => c.employeeId === e.id)
  )
  useEffect(() => {
    if (open) {
      const due = new Date()
      due.setDate(due.getDate() + 7)
      form.resetFields()
      form.setFieldsValue({ kind: 'financial', dueDate: isoDate(due) })
    }
  }, [open, form])
  return (
    <Modal
      open={open}
      title={t('wf.create')}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('wf.createDraft')}
      cancelText={t('wf.cancel')}
      okButtonProps={{ disabled: !eligible.length }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          onSave({
            type: 'create',
            ...values,
            amount: values.kind === 'financial' ? values.amount : null,
            id: crypto.randomUUID()
          })
        }
      >
        <Form.Item name="kind" label={t('wf.kind')}>
          <Select
            options={['financial', 'physical'].map((value) => ({ value, label: t(`wf.${value}`) }))}
          />
        </Form.Item>
        <Form.Item
          name="employeeId"
          label={t('wf.employee')}
          rules={[{ required: true, message: t('wf.required') }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={eligible.map((e) => ({ value: e.id, label: e.fullName }))}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={t('wf.purpose')}
          rules={[fieldRule(custodyRequired, t)]}
        >
          <Input aria-label={t('wf.purpose')} />
        </Form.Item>
        {kind === 'financial' ? (
          <Form.Item name="amount" label={t('wf.amount')} rules={[fieldRule(custodyMoney, t)]}>
            <InputNumber aria-label={t('wf.amount')} className="w-full!" min={0.01} precision={2} />
          </Form.Item>
        ) : (
          <Form.Item
            name="inventoryId"
            label={t('wf.inventoryUnit')}
            rules={[{ required: true, message: t('wf.required') }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              notFoundContent={t('wf.noInventory')}
              options={(inventory ?? [])
                .filter((i) => inventoryAvailable(assets, i))
                .map((i) => ({ value: i.id, label: `${i.name} · ${i.serial}` }))}
            />
          </Form.Item>
        )}
        <Form.Item name="dueDate" label={t('wf.dueDate')} rules={[fieldRule(custodyDate, t)]}>
          <Input aria-label={t('wf.dueDate')} type="date" min={isoDate()} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
