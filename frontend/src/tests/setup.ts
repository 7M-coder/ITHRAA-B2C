import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../public/locales/en/common.json'
import ar from '../../public/locales/ar/common.json'
await i18n.use(initReactI18next).init({
  lng: 'ar',
  fallbackLng: 'ar',
  resources: { en: { common: en }, ar: { common: ar } },
  defaultNS: 'common',
  interpolation: { escapeValue: false }
})
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})
