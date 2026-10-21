import { App, Button, Upload } from 'antd'
import { PaperClipOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { InvoiceAttachment } from '../types/workflow'
import { readInvoice } from '../utils/invoices'
interface Props {
  value?: InvoiceAttachment[]
  onChange?: (value: InvoiceAttachment[]) => void
}
/** Attaches invoice PDFs or images with local downloads. @param props - Controlled attachments. @returns Invoice picker. */
export function InvoiceInput({ value = [], onChange }: Props) {
  const { t } = useTranslation('custody')
  const { message } = App.useApp()
  return (
    <div>
      <Upload
        accept="application/pdf,image/png,image/jpeg"
        showUploadList={false}
        disabled={value.length >= 2}
        beforeUpload={async (file) => {
          try {
            const attachment = await readInvoice(file)
            onChange?.([...value, attachment])
          } catch {
            void message.error(t('wf.errors.attachmentInvalid'))
          }
          return false
        }}
      >
        <Button icon={<PaperClipOutlined />} disabled={value.length >= 2}>
          {t('wf.attachInvoice')}
        </Button>
      </Upload>
      <p className="text-xs text-muted">{t('wf.attachmentHint')}</p>
      {value.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-2">
          <a href={file.data} download={file.name}>
            {file.name}
          </a>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label={t('wf.removeAttachment')}
            onClick={() => onChange?.(value.filter((f) => f.id !== file.id))}
          />
        </div>
      ))}
    </div>
  )
}
