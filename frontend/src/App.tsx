import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import '@/antd/overrides.css'
/** Starts the local demo without server state providers or startup requests. @returns Application. */
export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
