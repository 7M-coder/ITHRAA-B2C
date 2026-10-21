import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../public/locales/en/common.json'
import ar from '../../public/locales/ar/common.json'
import employeesEn from '../../public/locales/en/employees.json'
import employeesAr from '../../public/locales/ar/employees.json'
import packagesEn from '../../public/locales/en/packages.json'
import packagesAr from '../../public/locales/ar/packages.json'
import custodyAr from '../../public/locales/ar/custody.json'
import custodyEn from '../../public/locales/en/custody.json'
// Node 25 exposes a partial global localStorage that shadows jsdom's Storage.
const localStorageData = new Map<string, string>()
Object.defineProperties(window.Storage.prototype, {
  getItem: {
    configurable: true,
    value: (key: string) => localStorageData.get(String(key)) ?? null
  },
  setItem: {
    configurable: true,
    value: (key: string, value: string) => localStorageData.set(String(key), String(value))
  },
  removeItem: { configurable: true, value: (key: string) => localStorageData.delete(String(key)) },
  clear: { configurable: true, value: () => localStorageData.clear() },
  key: {
    configurable: true,
    value: (index: number) => [...localStorageData.keys()][index] ?? null
  },
  length: { configurable: true, get: () => localStorageData.size }
})
const jsdomLocalStorage = Object.create(window.Storage.prototype) as Storage
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: jsdomLocalStorage })
Object.defineProperty(window, 'localStorage', { configurable: true, value: jsdomLocalStorage })
await i18n.use(initReactI18next).init({
  lng: 'ar',
  fallbackLng: 'ar',
  resources: {
    en: { common: en, packages: packagesEn, employees: employeesEn, custody: custodyEn },
    ar: { common: ar, packages: packagesAr, employees: employeesAr, custody: custodyAr }
  },
  ns: ['common', 'packages', 'employees', 'custody'],
  defaultNS: 'common',
  fallbackNS: 'common',
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

const readComputedStyle = window.getComputedStyle.bind(window)
Object.defineProperty(window, 'getComputedStyle', {
  value: (element: Element) => readComputedStyle(element)
})
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)
