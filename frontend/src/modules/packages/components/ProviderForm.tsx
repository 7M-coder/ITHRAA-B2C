import { useEffect } from 'react'
import { Button, Checkbox, Form, Input, Modal, Switch } from 'antd'
import { useTranslation } from 'react-i18next'
import type { ProviderCategory, ServiceProvider } from '../types/domain'
import { createPackageFieldRule, requiredPackageTextSchema } from '../validations/schemas'

interface ProviderFormProps {
  open: boolean
  initial?: ServiceProvider
  onCancel: () => void
  onSave: (provider: ServiceProvider) => void
}

/** Edits a reusable service-provider record. @param props - Dialog state and callbacks. @returns Provider editor. */
export function ProviderForm({ open, initial, onCancel, onSave }: ProviderFormProps) {
  const { t } = useTranslation('packages')
  const [form] = Form.useForm<ServiceProvider>()
  useEffect(() => {
    if (open) form.setFieldsValue(initial ?? { id: '', name: '', categories: [], active: true })
  }, [form, initial, open])
  const submit = (value: ServiceProvider) => {
    onSave({
      ...value,
      id: initial?.id ?? `provider-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    })
  }
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={initial ? t('provider.edit') : t('provider.create')}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="name"
          label={t('provider.name')}
          rules={[createPackageFieldRule(requiredPackageTextSchema, t)]}
        >
          <Input maxLength={120} />
        </Form.Item>
        <Form.Item
          name="categories"
          label={t('provider.categories')}
          rules={[{ required: true, message: t('messages.required') }]}
        >
          <Checkbox.Group
            options={(
              [
                'accommodation',
                'airline',
                'transport',
                'mashair',
                'catering',
                'guidance',
                'visa',
                'other'
              ] as ProviderCategory[]
            ).map((value) => ({ value, label: t(`provider.categoriesList.${value}`) }))}
          />
        </Form.Item>
        <Form.Item name="active" label={t('provider.active')} valuePropName="checked">
          <Switch />
        </Form.Item>
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
