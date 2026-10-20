import { App } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { render, screen, userEvent } from '@/tests/utils/test-utils'
import PackagesPage from '../pages/PackagesPage'

describe('package management page', () => {
  it('filters packages and opens the providers workspace', async () => {
    const user = userEvent.setup()
    render(
      <App>
        <MemoryRouter initialEntries={['/ar/packages']}>
          <PackagesPage />
        </MemoryRouter>
      </App>
    )
    expect(await screen.findByText('باقة ضيافة مكة')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('ابحث باسم الباقة أو وصفها أو الموسم'), 'دولية')
    expect(await screen.findByText('باقة ضيف الرحمن الدولية')).toBeInTheDocument()
    expect(screen.queryByText('باقة ضيافة مكة')).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'مقدمو الخدمة' }))
    expect(await screen.findByText('سجل مقدمي الخدمة')).toBeInTheDocument()
  }, 15000)
})
