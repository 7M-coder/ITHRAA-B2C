import { useEffect } from 'react'
import { Button, Form, Input, InputNumber, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { Purchase } from '../types/workflow'
import { purchaseSchema, purchaseLineSchema } from '../validations/schemas'
import { fieldRule } from '../../core/validations/schemas'
import { isoDate } from '../../core/utils/domain'
import { InvoiceInput } from './InvoiceInput'
interface Props {
  open: boolean
  initial?: Purchase
  minDate: string
  onClose: () => void
  onSave: (purchase: Purchase) => void
}
/** Records one invoice with several purchased lines and draft attachments. @param props - Invoice and callbacks. @returns Purchase form. */
export function PurchaseForm({ open, initial, minDate, onClose, onSave }: Props) {
  const { t } = useTranslation(['custody', 'common'])
  const [form] = Form.useForm<Purchase>()
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue(
        initial ?? {
          date: isoDate(),
          invoiceNumber: '',
          items: [{ description: '', quantity: 1, unitPrice: undefined }],
          attachments: [],
          missingInvoiceReason: ''
        }
      )
    }
  }, [open, initial, form])
  return (
    <Modal
      open={open}
      width={760}
      title={t(initial ? 'wf.editPurchase' : 'wf.addPurchase')}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('wf.saveDraft')}
      cancelText={t('wf.cancel')}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          onSave({
            ...values,
            id: initial?.id ?? crypto.randomUUID(),
            status: 'draft',
            reviewNote: ''
          })
        }
      >
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="supplier"
            label={t('wf.supplier')}
            rules={[fieldRule(purchaseSchema.shape.supplier, t)]}
          >
            <Input aria-label={t('wf.supplier')} />
          </Form.Item>
          <Form.Item
            name="date"
            label={t('wf.purchaseDate')}
            rules={[fieldRule(purchaseSchema.shape.date, t)]}
          >
            <Input aria-label={t('wf.purchaseDate')} type="date" min={minDate} max={isoDate()} />
          </Form.Item>
          <Form.Item
            name="invoiceNumber"
            label={t('wf.invoiceNumber')}
            rules={[fieldRule(purchaseSchema.shape.invoiceNumber, t)]}
          >
            <Input aria-label={t('wf.invoiceNumber')} />
          </Form.Item>
        </div>
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="grid gap-x-3 rounded-lg border border-line p-3 sm:grid-cols-4"
                >
                  <Form.Item
                    name={[field.name, 'description']}
                    label={t('wf.itemDescription')}
                    rules={[fieldRule(purchaseLineSchema.shape.description, t)]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'quantity']}
                    label={t('wf.quantity')}
                    rules={[fieldRule(purchaseLineSchema.shape.quantity, t)]}
                  >
                    <InputNumber min={1} precision={0} className="w-full!" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'unitPrice']}
                    label={t('wf.unitPrice')}
                    rules={[fieldRule(purchaseLineSchema.shape.unitPrice, t)]}
                  >
                    <InputNumber min={0.01} precision={2} className="w-full!" />
                  </Form.Item>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={fields.length === 1}
                    onClick={() => remove(field.name)}
                  >
                    {t('wf.removeLine')}
                  </Button>
                </div>
              ))}
              <Button
                icon={<PlusOutlined />}
                disabled={fields.length >= 100}
                onClick={() => add({ quantity: 1 })}
              >
                {t('wf.addLine')}
              </Button>
            </div>
          )}
        </Form.List>
        <Form.Item name="attachments" label={t('wf.invoice')}>
          <InvoiceInput />
        </Form.Item>
        <Form.Item
          name="missingInvoiceReason"
          label={t('wf.missingInvoiceReason')}
          rules={[fieldRule(purchaseSchema.shape.missingInvoiceReason, t)]}
        >
          <Input />
        </Form.Item>
        <p className="text-sm text-muted">{t('wf.invoiceHint')}</p>
      </Form>
    </Modal>
  )
}
