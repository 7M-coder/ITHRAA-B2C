import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
export default function useLocalizeDocumentAttributes() {
  const { i18n } = useTranslation()
  useEffect(() => {
    const language = i18n.resolvedLanguage || 'ar'
    document.documentElement.lang = language
    document.documentElement.dir = i18n.dir(language)
  }, [i18n, i18n.resolvedLanguage])
}
