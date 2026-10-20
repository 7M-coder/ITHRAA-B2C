import { Card } from 'antd'
import { useTranslation } from 'react-i18next'
import type { EditorStepProps } from '../types/editorProps'
import { financialSummary } from '../utils/finance'
import { PackageServicePricing } from './PackageServicePricing'

/** Edits fixed per-pilgrim service prices and displays the calculated service total. @param props - Controlled package. @returns Service pricing step. */
export function PackageFinancialStep({ item, onChange }: EditorStepProps) {
  const { t } = useTranslation('packages')
  return (
    <div className="space-y-5">
      <PackageServicePricing item={item} onChange={onChange} />
      <Card>
        <p className="mb-0 text-lg font-semibold">{financialSummary(item, t)}</p>
      </Card>
    </div>
  )
}
