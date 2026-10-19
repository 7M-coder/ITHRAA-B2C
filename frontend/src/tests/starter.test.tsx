import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'i18next'
vi.mock('@/i18n/config', () => ({
  getSavedLanguage: () => (localStorage.getItem('i18nextLng') === 'en' ? 'en' : 'ar')
}))
import { AppShell } from '@/AppShell'
import axiosClient from '@/api/axiosInstance'
import { getErrorMessage, getValidationErrors } from '@/api/utils/errorUtils'
const mount = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <AppShell />
    </MemoryRouter>
  )
beforeEach(async () => {
  await i18n.changeLanguage('ar')
})
describe('starter', () => {
  it('defaults to Arabic and switches language and document direction', async () => {
    mount()
    await screen.findByText('نظرة واضحة على فريقك، وعُهدك، وما يحتاج اهتمامك اليوم.')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    await userEvent.click(screen.getByRole('button', { name: 'English' }))
    await screen.findByText('Your people, assets, and priorities — all in one place.')
    await waitFor(() => expect(document.documentElement).toHaveAttribute('lang', 'en'))
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
  })
  it('uses the saved English language at the root', async () => {
    localStorage.setItem('i18nextLng', 'en')
    mount()
    await screen.findByText('Your people, assets, and priorities — all in one place.')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
  })
  it('restores and persists theme selection', async () => {
    localStorage.setItem('theme', 'dark')
    mount('/en')
    const button = await screen.findByRole('button', { name: 'Switch theme' })
    expect(document.documentElement).toHaveClass('dark')
    await userEvent.click(button)
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement).toHaveClass('light')
  })
  it('redirects an unknown page to the dashboard', async () => {
    mount('/ar/missing')
    await screen.findByText('نظرة واضحة على فريقك، وعُهدك، وما يحتاج اهتمامك اليوم.')
  })
})
describe('API foundation', () => {
  it('preserves the complete base URL and JSON defaults', async () => {
    const client = axiosClient('https://api.example.test/v1/')
    expect(client.defaults.baseURL).toBe('https://api.example.test/v1/')
    expect(client.defaults.timeout).toBe(60000)
    expect(client.defaults.withCredentials).toBeUndefined()
    client.defaults.adapter = async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    })
    expect((await client.get('health')).data).toEqual({ ok: true })
    expect(client.defaults.headers.Accept).toBe('application/json')
  })
  it('preserves rejected requests without authentication retries', async () => {
    const client = axiosClient()
    const error = new Error('Network unavailable')
    const adapter = vi.fn().mockRejectedValue(error)
    client.defaults.adapter = adapter
    await expect(client.get('/example')).rejects.toBe(error)
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(getErrorMessage(error)).toBe('Network unavailable')
    expect(getErrorMessage({})).toBe('An error occurred')
  })
  it('normalizes backend detail and field validation messages', () => {
    const error = {
      response: { data: { detail: ['First', 'Second'], errors: { email: ['Invalid'] } } }
    }
    expect(getErrorMessage(error)).toBe('First, Second')
    expect(getValidationErrors(error)).toEqual({ email: ['Invalid'] })
  })
})
