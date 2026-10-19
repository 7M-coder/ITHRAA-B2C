import { Suspense } from 'react'
import { StyleProvider } from '@ant-design/cssinjs'
import ThemeProvider from '@/context/ThemeProvider'
import LanguageProvider from '@/context/LanguageProvider'
import { AppRoutes } from './AppRoutes'
/** Composes localization and Ant Design providers. @returns Demo shell. */
export function AppShell() {
  return (
    <Suspense fallback={<div role="status" aria-busy="true" />}>
      <LanguageProvider>
        <StyleProvider layer>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </StyleProvider>
      </LanguageProvider>
    </Suspense>
  )
}
