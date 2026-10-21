import { Alert, Card, Empty } from 'antd'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/modules/core/components/PageHeader'

/** Shows the reserved input area for a category whose data shape is pending. @returns Input category page. */
export default function InputCategoryPage() {
  const { category } = useParams()
  const { t } = useTranslation('inputs')
  const title = t(`categories.${category}`, { defaultValue: t('inputs') })
  return (
    <>
      <PageHeader title={title} description={t('categoryDescription')} />
      <Alert className="mb-5!" type="info" showIcon message={t('categoryPending')} />
      <Card>
        <Empty description={t('noCategoryRecords')} />
      </Card>
    </>
  )
}
