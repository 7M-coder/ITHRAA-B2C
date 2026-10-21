import { useEffect } from 'react'
import { Form, Input, Modal, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import type { InventoryItem } from '../types/workflow'
import { inventorySchema } from '../validations/schemas'
import { fieldRule } from '../../core/validations/schemas'
interface Props {
  open: boolean
  onClose: () => void
  onSave: (item: InventoryItem) => void
}
/** Registers a physical asset and delivery condition. @param props - Dialog callbacks. @returns Inventory form. */
export function InventoryForm({ open, onClose, onSave }: Props) {
  const { t } = useTranslation(['custody', 'common'])
  const [form] = Form.useForm<InventoryItem>()
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ type: 'Laptop', accessories: '' })
    }
  }, [open, form])
  return (
    <Modal
      open={open}
      title={t('wf.addInventory')}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('wf.save')}
      cancelText={t('wf.cancel')}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onSave({ ...values, id: crypto.randomUUID(), retired: false })}
      >
        <Form.Item name="type" label={t('wf.assetType')} rules={[{ required: true }]}>
          <Select
            options={['Laptop', 'Car', 'Equipment'].map((value) => ({
              value,
              label: t(`wf.types.${value}`)
            }))}
          />
        </Form.Item>
        {(['name', 'serial', 'condition', 'accessories'] as const).map((key) => (
          <Form.Item
            key={key}
            name={key}
            label={t(`wf.${key}`)}
            rules={[fieldRule(inventorySchema.shape[key], t)]}
          >
            <Input aria-label={t(`wf.${key}`)} />
          </Form.Item>
        ))}
      </Form>
    </Modal>
  )
}
