import { Navigate, Route, Routes } from 'react-router-dom'
import { getSavedLanguage } from '@/i18n/config'
import { DemoLayout } from '@/modules/core/layouts/DemoLayout'
import DashboardPage from '@/modules/dashboard/pages/DashboardPage'
import EmployeesPage from '@/modules/employees/pages/EmployeesPage'
import PayrollPage from '@/modules/payroll/pages/PayrollPage'
import CustodyPage from '@/modules/custody/pages/CustodyPage'
import ClearancePage from '@/modules/clearance/pages/ClearancePage'
import PackageEditorPage from '@/modules/packages/pages/PackageEditorPage'
import PackagesPage from '@/modules/packages/pages/PackagesPage'
/** Defines localized routes and redirects unknown paths to the dashboard. @returns Route tree. */
export function AppRoutes() {
  return (
    <Routes>
      {['ar', 'en'].map((language) => (
        <Route key={language} path={`/${language}`} element={<DemoLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="custody" element={<CustodyPage />} />
          <Route path="clearance" element={<ClearancePage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="packages/new" element={<PackageEditorPage key="new" />} />
          <Route path="packages/:id/edit" element={<PackageEditorPage key="edit" />} />
          <Route path="*" element={<Navigate to={`/${language}`} replace />} />
        </Route>
      ))}
      {['employees', 'payroll', 'custody', 'clearance', 'packages'].map((path) => (
        <Route
          key={path}
          path={`/${path}`}
          element={<Navigate to={`/${getSavedLanguage()}/${path}`} replace />}
        />
      ))}
      <Route path="*" element={<Navigate to={`/${getSavedLanguage()}`} replace />} />
    </Routes>
  )
}
