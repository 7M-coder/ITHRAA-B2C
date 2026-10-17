import { useEffect, useState, type ReactNode } from 'react'
import { ConfigProvider, App } from 'antd'
import arEG from 'antd/locale/ar_EG'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { getThemeConfig } from '@/antd/themeConfig'
import { ThemeContext } from './ThemeContext'
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [isDarkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    document.documentElement.classList.toggle('light', !isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])
  const arabic = i18n.resolvedLanguage === 'ar'
  return (
    <ThemeContext.Provider
      value={{ isDarkMode, toggleTheme: () => setDarkMode((value) => !value) }}
    >
      <ConfigProvider
        theme={getThemeConfig(isDarkMode)}
        locale={arabic ? arEG : enUS}
        direction={arabic ? 'rtl' : 'ltr'}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
