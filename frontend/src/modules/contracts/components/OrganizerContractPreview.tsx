import { Alert, Descriptions, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import type { OrganizerContractDraft } from '../types/domain'
import ithraaMark from '@/assets/ithraa-mark.png'

interface Props {
  contract: OrganizerContractDraft
}

/** Displays the English organizer contract in a print-ready layout. @param props - Contract draft data. @returns Contract preview document. */
export function OrganizerContractPreview({ contract }: Props) {
  const { t } = useTranslation('contracts')
  const fields: (keyof OrganizerContractDraft)[] = [
    'pilgrimCount',
    'organizerName',
    'passportNumber',
    'nationality',
    'mobileNumber',
    'country',
    'city',
    'languages',
    'hajjExperience'
  ]
  return (
    <div id="contract-print-root" dir="ltr" lang="en">
      <Alert
        className="contract-preview-warning mb-5!"
        type="warning"
        showIcon
        message={t('draftWarning')}
      />
      <div className="contract-document-header">
        <div>
          <div className="contract-brand">Ithraa Alkhair</div>
          <div className="contract-brand-subtitle">Direct Hajj Management B2C</div>
        </div>
        <img src={ithraaMark} alt="Ithraa Alkhair" />
      </div>
      <div className="contract-document-title">
        <Typography.Title level={2}>{t('documentTitle')}</Typography.Title>
        <span>{t('draftLabel')}</span>
      </div>
      <p>{t('contractOpening')}</p>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label={t('organizerSource')}>
          {contract.organizerSource === 'direct' ? t('direct') : t('indirect')}
        </Descriptions.Item>
        {fields.map((field) => (
          <Descriptions.Item key={field} label={t(field)}>
            <span dir="ltr">{contract[field]}</span>
          </Descriptions.Item>
        ))}
      </Descriptions>
      <div className="contract-signatures">
        <div>
          <strong>{t('companyRepresentative')}</strong>
          <span>{t('signatureLine')}</span>
        </div>
        <div>
          <strong>{contract.organizerName}</strong>
          <span>{t('signatureLine')}</span>
        </div>
      </div>
      <div className="contract-document-notice">{t('documentNotice')}</div>
    </div>
  )
}
