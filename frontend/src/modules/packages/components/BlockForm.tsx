import { useEffect } from 'react'
import { Button, Form, Input, Modal, Select } from 'antd'
import { useTranslation } from 'react-i18next'
import type { HajjPackage, OperationsBlock, ServiceProvider } from '../types/domain'
import { createPackageFieldRule, requiredPackageTextSchema } from '../validations/schemas'

interface BlockFormProps {
  open: boolean
  initial?: OperationsBlock
  packages: HajjPackage[]
  providers: ServiceProvider[]
  onCancel: () => void
  onSave: (block: OperationsBlock) => void
}

/** Edits a minimal operations block and assigns one compatible package. @param props - Dialog state and related records. @returns Block editor. */
export function BlockForm({ open, initial, packages, onCancel, onSave }: BlockFormProps) {
  const { t } = useTranslation('packages')
  const [form] = Form.useForm<OperationsBlock>()
  const season = Form.useWatch('season', form)
  useEffect(() => {
    if (open)
      form.setFieldsValue(
        initial ?? {
          id: '',
          code: '',
          name: '',
          season: '',
          pilgrimType: 'international',
          packageId: null
        }
      )
  }, [form, initial, open])
  const eligible = packages.filter(
    (item) =>
      (item.status === 'available' || item.id === initial?.packageId) && item.season === season
  )
  const submit = (value: OperationsBlock) => {
    onSave({
      ...value,
      pilgrimType: 'international',
      packageId: value.packageId || null,
      id: initial?.id ?? `block-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    })
  }
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={initial ? t('block.edit') : t('block.create')}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="code"
          label={t('block.code')}
          rules={[createPackageFieldRule(requiredPackageTextSchema, t)]}
        >
          <Input maxLength={40} />
        </Form.Item>
        <Form.Item
          name="name"
          label={t('block.name')}
          rules={[createPackageFieldRule(requiredPackageTextSchema, t)]}
        >
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item
          name="season"
          label={t('fields.season')}
          rules={[createPackageFieldRule(requiredPackageTextSchema, t)]}
        >
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item name="packageId" label={t('block.package')}>
          <Select
            allowClear
            options={eligible.map((item) => ({ value: item.id, label: item.name }))}
            placeholder={t('block.noPackage')}
          />
        </Form.Item>
        <p className="mb-4 text-xs text-muted">{t('block.liveLinkNote')}</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>{t('actions.cancel')}</Button>
          <Button type="primary" htmlType="submit">
            {t('actions.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
