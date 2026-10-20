import { useState } from 'react'
import { Alert, App, Button, Card, Form, Input, InputNumber, Modal, Select, Typography } from 'antd'
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/core/components/PageHeader'
import { fieldRule } from '@/modules/core/validations/schemas'
import { organizerContractFieldSchemas, organizerContractSchema } from '../validations/schemas'
import type { OrganizerContractDraft } from '../types/domain'
import { OrganizerContractPreview } from '../components/OrganizerContractPreview'
import { printContractDocument } from '../utils/printContract'

/** Collects organizer details in English and offers a print-ready draft. @returns Organizer contracts page. */
export default function OrganizerContractsPage() {
  const { t } = useTranslation(['contracts', 'common'])
  const [form] = Form.useForm<OrganizerContractDraft>()
  const [contract, setContract] = useState<OrganizerContractDraft>()
  const [previewOpen, setPreviewOpen] = useState(false)
  const { message } = App.useApp()
  const fields = organizerContractFieldSchemas

  const textField = (
    name: Exclude<keyof OrganizerContractDraft, 'organizerSource' | 'pilgrimCount'>
  ) => (
    <Form.Item name={name} label={t(name)} rules={[fieldRule(fields[name], t)]}>
      <Input
        maxLength={name === 'hajjExperience' ? 1000 : 200}
        dir="ltr"
        lang="en"
        placeholder={t('englishInputHint')}
      />
    </Form.Item>
  )

  const preview = async () => {
    try {
      const values = await form.validateFields()
      const result = organizerContractSchema.safeParse(values)
      if (!result.success) {
        form.setFields(
          result.error.issues.map((issue) => ({
            name: issue.path[0] as keyof OrganizerContractDraft,
            errors: [t(issue.message)]
          }))
        )
        void message.error(t('invalidForm'))
        return
      }
      setContract(result.data)
      setPreviewOpen(true)
    } catch {
      void message.error(t('invalidForm'))
    }
  }

  return (
    <>
      <PageHeader title={t('pageTitle')} description={t('pageDescription')} />
      <Alert
        className="mb-6!"
        type="warning"
        showIcon
        message={t('draftWarning')}
        description={t('draftWarningDetail')}
      />
      <Card
        title={
          <span className="flex items-center gap-2">
            <FileTextOutlined />
            {t('formTitle')}
          </span>
        }
      >
        <Typography.Paragraph>{t('englishInputHint')}</Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => {
            setContract(undefined)
            setPreviewOpen(false)
          }}
        >
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item
              name="organizerSource"
              label={t('organizerSource')}
              rules={[fieldRule(fields.organizerSource, t)]}
            >
              <Select
                options={[
                  { value: 'direct', label: t('direct') },
                  { value: 'indirect', label: t('indirect') }
                ]}
              />
            </Form.Item>
            <Form.Item
              name="pilgrimCount"
              label={t('pilgrimCount')}
              rules={[fieldRule(fields.pilgrimCount, t)]}
            >
              <InputNumber className="w-full!" min={1} max={100000} precision={0} />
            </Form.Item>
            {textField('organizerName')}
            {textField('passportNumber')}
            {textField('nationality')}
            {textField('mobileNumber')}
            {textField('country')}
            {textField('city')}
            {textField('languages')}
          </div>
          <Form.Item
            name="hajjExperience"
            label={t('hajjExperience')}
            rules={[fieldRule(fields.hajjExperience, t)]}
          >
            <Input.TextArea
              rows={3}
              maxLength={1000}
              showCount
              dir="ltr"
              lang="en"
              placeholder={t('englishInputHint')}
            />
          </Form.Item>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => void preview()}>
            {t('previewContract')}
          </Button>
        </Form>
      </Card>
      <Modal
        className="contract-preview-modal"
        title={t('previewTitle')}
        open={previewOpen && Boolean(contract)}
        onCancel={() => setPreviewOpen(false)}
        width={920}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            {t('closePreview')}
          </Button>,
          <Button
            key="print"
            type="primary"
            onClick={() => {
              if (!printContractDocument()) void message.error(t('printUnavailable'))
            }}
          >
            {t('printPdf')}
          </Button>
        ]}
      >
        {contract && <OrganizerContractPreview contract={contract} />}
      </Modal>
      <a
        className="mt-5 inline-block text-sm text-[#008186]"
        href="/templates/organizer-contract-template.docx"
        download
      >
        {t('downloadTemplate')}
      </a>
    </>
  )
}
