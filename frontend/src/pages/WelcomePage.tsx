import { Button, Card, Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
export default function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { toggleTheme } = useTheme()
  return (
    <main className="starter">
      <Card>
        <Space direction="vertical" size="large">
          <Typography.Title level={1}>{t('welcome')}</Typography.Title>
          <Typography.Paragraph>{t('description')}</Typography.Paragraph>
          <Space wrap>
            <Button type="primary" onClick={() => navigate(pathname === '/ar' ? '/en' : '/ar')}>
              {t('language')}
            </Button>
            <Button onClick={toggleTheme}>{t('theme')}</Button>
          </Space>
        </Space>
      </Card>
    </main>
  )
}
