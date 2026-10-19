import { useEffect } from 'react'
import { App, Form, Input, Modal, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import { useDemoStore } from '../../core/hooks/useDemoStore'
import { isoDate } from '../../core/utils/domain'
import { assetSchema, fieldRule } from '../../core/validations/schemas'
import type { Asset } from '../../core/types/domain'
interface Props {
  open: boolean
  onClose: () => void
}
/** Assigns custody to an employee by stable ID. @param props - Dialog state. @returns Assignment dialog. */
export function AssetForm({ open, onClose }: Props) {
  const { t } = useTranslation(['custody', 'common'])
  const [form] = Form.useForm<Asset>()
  const { message } = App.useApp()
  const employees = useDemoStore((s) => s.employees)
  const clearances = useDemoStore((s) => s.clearances)
  const add = useDemoStore((s) => s.addAsset)
  const eligible = employees.filter((e) => !clearances.some((c) => c.employeeId === e.id))
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ type: 'Laptop', assignedAt: isoDate(), serialNumber: '' })
    }
  }, [open, form])
  const submit = (values: Asset) => {
    try {
      add({
        ...values,
        id: crypto.randomUUID(),
        status: 'Active',
        serialNumber: values.serialNumber || ''
      })
      void message.success(t('saved'))
      onClose()
    } catch {
      void message.error(t('saveError'))
    }
  }
  return (
    <Modal
      open={open}
      title={t('assignAsset')}
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ disabled: !eligible.length }}
      okText={t('save')}
      cancelText={t('cancel')}
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="employeeId"
          label={t('employee')}
          rules={[{ required: true, message: t('required') }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t('selectEmployee')}
            notFoundContent={t('noAssignable')}
            options={eligible.map((e) => ({ value: e.id, label: e.fullName }))}
          />
        </Form.Item>
        <Form.Item name="type" label={t('assetType')}>
          <Select
            options={['Car', 'Laptop', 'Advance'].map((value) => ({ value, label: t(value) }))}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={t('description')}
          rules={[fieldRule(assetSchema.shape.description, t)]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="serialNumber"
          label={`${t('serialNumber')} (${t('optional')})`}
          rules={[fieldRule(assetSchema.shape.serialNumber, t)]}
        >
          <Input dir="ltr" />
        </Form.Item>
        <Form.Item
          name="assignedAt"
          label={t('assignedAt')}
          rules={[fieldRule(assetSchema.shape.assignedAt, t)]}
        >
          <Input type="date" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
