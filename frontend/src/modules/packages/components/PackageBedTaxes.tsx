import { Descriptions } from 'antd'
import { useTranslation } from 'react-i18next'
import type { BedTaxRates } from '../types/editor'
import { BED_TAX_RATES } from '../utils/bedPricing'
interface Props {
  rates?: BedTaxRates
}
/** Shows the business-specified additive rates once beside their calculation inputs. @param props - Recorded tax rates. @returns Tax summary. */
export function PackageBedTaxes({ rates = BED_TAX_RATES }: Props) {
  const { t } = useTranslation('packages')
  return (
    <section>
      <h3>{t('editor.bedTaxes')}</h3>
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, lg: 4 }}
        items={(['vat', 'accommodation', 'collection', 'city'] as const).map((key) => ({
          key,
          label: t(`editor.bedTaxLabels.${key}`),
          children: `${rates[key]}%`
        }))}
      />
      <p className="text-sm text-muted">{t('editor.bedTaxesHelp')}</p>
    </section>
  )
}
