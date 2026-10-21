import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { App } from 'antd'
import i18n from 'i18next'
import PackageEditorPage from '../pages/PackageEditorPage'
import { usePackageStore } from '../hooks/usePackageStore'
import { seedPackageData } from '../utils/seed'
import { upgradePackage } from '../utils/migration'
import { completePackage } from './fixtures'
import { editorData } from '../utils/finance'
const nativeRequest = globalThis.Request
beforeEach(() => {
  vi.stubGlobal(
    'Request',
    class MemoryRouterRequest {
      url: string
      method: string
      headers: Headers
      signal?: AbortSignal
      constructor(input: string | URL, init: RequestInit = {}) {
        this.url = String(input)
        this.method = init.method ?? 'GET'
        this.headers = new Headers(init.headers)
        this.signal = init.signal ?? undefined
      }
    } as unknown as typeof Request
  )
})
afterEach(() => vi.stubGlobal('Request', nativeRequest))
/** Mounts the actual wizard with a data router so navigation guards run. @param route - Initial route. @returns Router instance. */
function mount(route = '/en/packages/new') {
  const router = createMemoryRouter(
    [
      { path: '/:lang/packages/new', element: <PackageEditorPage key="new" /> },
      { path: '/:lang/packages/:id/edit', element: <PackageEditorPage key="edit" /> },
      { path: '/:lang/packages', element: <p>Package list</p> }
    ],
    { initialEntries: [route] }
  )
  render(
    <App>
      <RouterProvider router={router} />
    </App>
  )
  return router
}
beforeEach(async () => {
  await i18n.changeLanguage('en')
  const seed = seedPackageData()
  usePackageStore.setState({ ...seed, packages: seed.packages.map(upgradePackage) })
})
describe('package wizard', () => {
  it('requires a name and saves a minimal draft with preset season and currency', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(await screen.findByText('Review the following fields before saving')).toBeInTheDocument()
    expect(usePackageStore.getState().packages).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Package name'), { target: { value: 'Minimal draft' } })
    expect(screen.queryByLabelText('Hajj season')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Currency code')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(usePackageStore.getState().packages).toHaveLength(3))
    expect(usePackageStore.getState().packages).toHaveLength(3)
    expect(usePackageStore.getState().packages[2]).toMatchObject({
      season: '1448',
      currency: 'SAR'
    })
    expect(usePackageStore.getState().packages[2].name).toBe('Minimal draft')
  }, 35000)
  it('edits service prices and saves them across remounts', async () => {
    const p = completePackage()
    usePackageStore.setState({ packages: [p] })
    mount(`/en/packages/${p.id}/edit`)
    fireEvent.click(screen.getByRole('button', { name: '4 Service pricing' }))
    expect(screen.getByLabelText('Intercity bus ticket Per-pilgrim price before VAT')).toHaveValue(
      '100.00'
    )
    expect(screen.getByRole('button', { name: 'Save as available' })).toBeEnabled()
    expect(screen.getByText(/1150\.00 SAR/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(editorData(usePackageStore.getState().packages[0]).servicePrices).toHaveLength(13)
    expect(editorData(usePackageStore.getState().packages[0]).servicePrices[0].amount).toBe(100)
  }, 35000)
  it('removes a hotel stay without room-option confirmation', async () => {
    const p = completePackage()
    usePackageStore.setState({ packages: [p] })
    mount(`/en/packages/${p.id}/edit`)
    fireEvent.click(screen.getByRole('button', { name: '2 Stays' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove stay' })[0])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '4 Service pricing' }))
    expect(screen.queryByLabelText('People per room for stay')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(editorData(usePackageStore.getState().packages[0]).stays).toHaveLength(1)
    expect(editorData(usePackageStore.getState().packages[0]).stays).toHaveLength(1)
  }, 35000)
})

it('commits calendar dates as ISO values and rejects negative capacity without silently turning it into zero', async () => {
  const p = completePackage()
  usePackageStore.setState({ packages: [p] })
  mount(`/en/packages/${p.id}/edit`)
  const input = screen.getByLabelText('Start date')
  fireEvent.change(input, { target: { value: '2027-05-09' } })
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 })
  fireEvent.blur(input)
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  await waitFor(() => expect(usePackageStore.getState().packages[0].startDate).toBe('2027-05-09'))
  fireEvent.change(screen.getByLabelText('Capacity (pilgrims)'), { target: { value: '-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
  expect(await screen.findByText('Review the following fields before saving')).toBeInTheDocument()
  expect(editorData(usePackageStore.getState().packages[0]).capacity).toBe(46)
}, 35000)
