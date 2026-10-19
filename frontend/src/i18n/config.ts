import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
export const LANGUAGE_STORAGE_KEY = 'i18nextLng'
export const getSavedLanguage = () =>
  localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'ar'
void i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['ar', 'en'],
    fallbackLng: 'ar',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'employees', 'payroll', 'custody', 'clearance'],
    fallbackNS: 'common',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage']
    },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    interpolation: { escapeValue: false }
  })
export default i18n
