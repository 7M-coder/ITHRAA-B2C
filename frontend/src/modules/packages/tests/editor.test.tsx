import { beforeEach, describe, expect, it } from 'vitest'
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
  it('requires a name, uses preset season and currency, saves a minimal draft, and confirms unsaved exits', async () => {
    const router = mount()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(await screen.findByText('Review the following fields before saving')).toBeInTheDocument()
    expect(usePackageStore.getState().packages).toHaveLength(2)
    fireEvent.change(screen.getByLabelText('Package name'), { target: { value: 'Minimal draft' } })
    expect(screen.queryByLabelText('Hajj season')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Currency code')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(router.state.location.pathname).toMatch(/\/edit$/))
    expect(usePackageStore.getState().packages).toHaveLength(3)
    expect(usePackageStore.getState().packages[2]).toMatchObject({
      season: '1448',
      currency: 'SAR'
    })
    fireEvent.change(screen.getByLabelText('Package name'), { target: { value: 'Unsaved' } })
    fireEvent.click(screen.getByRole('button', { name: 'Back to packages' }))
    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByLabelText('Package name')).toHaveValue('Unsaved')
    fireEvent.click(screen.getByRole('button', { name: 'Back to packages' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Leave without saving' }))
    expect(await screen.findByText('Package list')).toBeInTheDocument()
    expect(usePackageStore.getState().packages[2].name).toBe('Minimal draft')
  }, 35000)
  it('switches modes without copying the cost into the price, saves and remounts', async () => {
    const p = completePackage()
    usePackageStore.setState({ packages: [p] })
    const router = mount(`/en/packages/${p.id}/edit`)
    fireEvent.click(screen.getByRole('button', { name: '4 Rooms & pricing' }))
    expect(screen.getByLabelText('Amount / person')).toHaveValue('1200')
    fireEvent.click(screen.getByText('Cost draft', { exact: true }))
    expect(screen.queryByRole('button', { name: 'Save as available' })).not.toBeInTheDocument()
    expect(screen.getByText('Estimated cost / person: 650.00 SAR')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Approved price', { exact: true }))
    expect(screen.getByLabelText('Amount / person')).toHaveValue('1200')
    fireEvent.click(screen.getByText('Cost draft', { exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(editorData(usePackageStore.getState().packages[0]).mode).toBe('cost_draft')
    fireEvent.click(screen.getByRole('button', { name: 'Back to packages' }))
    await router.navigate(`/en/packages/${p.id}/edit`)
    fireEvent.click(await screen.findByRole('button', { name: '4 Rooms & pricing' }))
    expect(screen.getByRole('radio', { name: 'Cost draft' })).toBeChecked()
  }, 35000)
  it('requires confirmation before deleting a linked stay and flags the affected option', async () => {
    const p = completePackage()
    usePackageStore.setState({ packages: [p] })
    mount(`/en/packages/${p.id}/edit`)
    fireEvent.click(screen.getByRole('button', { name: '2 Stays' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove stay' })[0])
    expect(await screen.findByRole('dialog', { name: 'Remove stay' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    fireEvent.click(screen.getByRole('button', { name: '4 Rooms & pricing' }))
    expect(
      screen.getByLabelText('I reviewed this option after the stay changes')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save as available' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    expect(editorData(usePackageStore.getState().packages[0]).stays).toHaveLength(1)
    expect(editorData(usePackageStore.getState().packages[0]).options[0].needsReview).toBe(true)
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
