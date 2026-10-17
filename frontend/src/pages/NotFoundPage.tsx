import { Result, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  const { t, i18n } = useTranslation()
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('notFound')}
      extra={
        <Link to={`/${i18n.resolvedLanguage === 'en' ? 'en' : 'ar'}`}>
          <Button type="primary">{t('home')}</Button>
        </Link>
      }
    />
  )
}
