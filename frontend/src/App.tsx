import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './AppShell'
import '@/antd/overrides.css'
const router = createBrowserRouter([{ path: '*', element: <AppShell /> }])
/** Starts the local demo without server state providers or startup requests. @returns Application. */
export default function App() {
  return <RouterProvider router={router} />
}
