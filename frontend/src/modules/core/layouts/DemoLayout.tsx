import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Alert, App, Avatar, Button, Drawer, Dropdown, Menu, Tag } from 'antd'
import {
  AppstoreOutlined,
  TeamOutlined,
  WalletOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  MenuOutlined,
  DownOutlined,
  LogoutOutlined,
  BulbOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { useStorageStatus } from '../hooks/useDemoStore'
import { formatDate, isoDate } from '../utils/domain'
import ithraaMark from '@/assets/ithraa-mark.png'
/** Provides persistent navigation and demo account controls. @returns Application layout. */
export function DemoLayout() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'ar'
  const location = useLocation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const storageError = useStorageStatus((s) => s.error)
  const currentPath = location.pathname.split('/')[2] || ''
  const navLink = (key: string, path: string, icon: React.ReactNode) => ({
    key: path,
    icon,
    label: (
      <Link onClick={() => setOpen(false)} to={`/${language}/${path}`}>
        {t(key)}
      </Link>
    )
  })
  const items = [
    navLink('dashboard', '', <AppstoreOutlined />),
    {
      key: 'human-resources',
      icon: <TeamOutlined />,
      label: t('humanResources'),
      children: [
        navLink('employees', 'employees', <TeamOutlined />),
        navLink('payroll', 'payroll', <WalletOutlined />),
        navLink('clearance', 'clearance', <SafetyCertificateOutlined />)
      ]
    },
    {
      key: 'custody-section',
      icon: <BankOutlined />,
      label: t('custodySection'),
      children: [navLink('custody', 'custody', <InboxOutlined />)]
    }
  ]
  const navigation = (
    <>
      <Link to={`/${language}`} className="flex items-center gap-3 px-6 pb-7 pt-8 text-inherit! no-underline">
        <img src={ithraaMark} alt="" className="h-12 w-12 shrink-0 object-contain" />
        <div className="min-w-0">
          <div className="text-xl font-bold text-[#008186]">{t('brand')}</div>
          <div className="mt-1 text-xs leading-5 text-muted">{t('product')}</div>
        </div>
      </Link>
      <div className="px-7 pb-3 text-xs tracking-widest text-muted">{t('workspace')}</div>
      <Menu
        className="border-none! bg-transparent! px-3"
        mode="inline"
        selectedKeys={[currentPath]}
        defaultOpenKeys={
          currentPath === 'custody' ? ['custody-section'] : currentPath ? ['human-resources'] : []
        }
        items={items}
      />
      <div className="mx-6 mt-10 rounded-xl border border-line p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-[#008186]">
          <CheckCircleOutlined />
          {t('demo')}
        </div>
        <p className="m-0 text-xs leading-6 text-muted">{t('localNote')}</p>
      </div>
    </>
  )
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 start-0 z-20 hidden w-64 border-e border-line bg-surface lg:block">
        {navigation}
      </aside>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement={language === 'ar' ? 'right' : 'left'}
        title={t('menu')}
      >
        {navigation}
      </Drawer>
      <div className="lg:ms-64">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              className="lg:hidden!"
              aria-label={t('menu')}
              icon={<MenuOutlined />}
              onClick={() => setOpen(true)}
            />
            <span className="hidden text-sm text-muted sm:inline">
              {formatDate(isoDate(), language)}
            </span>
            <Tag className="m-0! hidden! rounded-full! border-0! bg-teal-50! px-3! text-[#008186]! sm:inline-block!">
              {t('demo')}
            </Tag>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              onClick={() =>
                navigate(location.pathname.replace(/^\/(ar|en)/, language === 'ar' ? '/en' : '/ar'))
              }
            >
              {t('language')}
            </Button>
            <Button
              type="text"
              aria-label={t('theme')}
              icon={<BulbOutlined />}
              onClick={toggleTheme}
            />
            <Dropdown
              open={accountOpen}
              onOpenChange={setAccountOpen}
              trigger={['click']}
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: t('logout'),
                    onClick: () => void message.info(t('logoutDemo'))
                  }
                ]
              }}
            >
              <Button
                type="text"
                className="h-auto! px-2! py-1!"
                aria-label={t('accountName')}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <Avatar className="bg-[#e6f2f1]! text-[#008186]!" icon={<TeamOutlined />} />
                <span className="hidden text-start sm:block">
                  <span className="block text-sm font-bold">{t('accountName')}</span>
                  <span className="block text-xs text-muted">{t('accountRole')}</span>
                </span>
                <DownOutlined className="text-xs" />
              </Button>
            </Dropdown>
          </div>
        </header>
        <main className="mx-auto max-w-400 p-4 sm:p-8 lg:p-10">
          {storageError && (
            <Alert className="mb-5!" type="warning" showIcon message={t('storageError')} />
          )}
          <Outlet />
        </main>
        <footer className="mx-4 flex flex-wrap justify-between gap-2 border-t border-line py-5 text-xs text-muted sm:mx-8 lg:mx-10">
          <span>{t('footer')}</span>
          <span className="flex items-center gap-2">
            <CheckCircleOutlined />
            {t(storageError ? 'notSaved' : 'localSaved')}
          </span>
        </footer>
      </div>
    </div>
  )
}
