import { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StyleProvider } from '@ant-design/cssinjs'
import ThemeProvider from '@/context/ThemeProvider'
import LanguageProvider from '@/context/LanguageProvider'
import { getSavedLanguage } from '@/i18n/config'
import WelcomePage from '@/pages/WelcomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import '@/antd/overrides.css'
const queryClient = new QueryClient()
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${getSavedLanguage()}`} replace />} />
      <Route path="/ar" element={<WelcomePage />} />
      <Route path="/en" element={<WelcomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
export function AppShell() {
  return (
    <Suspense fallback={<div role="status">Loading…</div>}>
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
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
