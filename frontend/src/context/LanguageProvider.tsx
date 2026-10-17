import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useLocalizeDocumentAttributes from '@/i18n/useLocalizeDocumentAttributes'
export default function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const language = pathname.split('/')[1]
  useLocalizeDocumentAttributes()
  useEffect(() => {
    if ((language === 'ar' || language === 'en') && i18n.resolvedLanguage !== language)
      void i18n.changeLanguage(language)
  }, [language, i18n])
  return <>{children}</>
}
