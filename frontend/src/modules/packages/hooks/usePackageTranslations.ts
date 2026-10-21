import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/** Refreshes an older loaded package dictionary without reloading an unsaved form. @returns Package translations that react to refreshed resources. */
export function usePackageTranslations() {
  const translation = useTranslation('packages', { bindI18n: 'languageChanged loaded' })
  const { i18n } = translation
  const language = i18n.resolvedLanguage ?? i18n.language
  useEffect(() => {
    if (!i18n.exists('editor.roomTypesLabel', { ns: 'packages', lng: language }))
      void i18n.reloadResources(language, 'packages')
  }, [i18n, language])
  return translation
}
