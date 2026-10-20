import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { App } from 'antd'
import i18n from 'i18next'
import { PackageServicesStep } from '../components/PackageServicesStep'
import { PackageStayPeriods } from '../components/PackageStayPeriods'
import { newPackage } from '../utils/editor'
import { newStay } from '../utils/finance'
import { resizePeriods, withPeriods } from '../utils/periods'
import { packageSchema, packageRecordSchema } from '../validations/schemas'
import { usePackageStore } from '../hooks/usePackageStore'
import type { HajjPackage, ServiceProvider } from '../types/domain'

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

it('caps period edits at three and rejects writes of four without discarding historical periods', () => {
  const item = { ...newPackage(), name: 'Period limit' }
  const stay = newStay()
  const three = resizePeriods(stay, 3)
  expect(resizePeriods(three, 4)).toBe(three)
  const four = withPeriods(
    stay,
    [0, 1, 2, 3].map((i) => ({
      id: `p-${i}`,
      checkIn: `2027-05-${10 + i}`,
      checkOut: `2027-05-${11 + i}`
    }))
  )
  item.editor!.stays = [four]
  expect(packageRecordSchema.safeParse(item).success).toBe(true)
  expect(packageSchema.safeParse(item).success).toBe(false)
  const onChange = vi.fn()
  render(
    <App>
      <PackageStayPeriods item={item} stay={three} onChange={onChange} />
    </App>
  )
  expect(screen.getByLabelText('Number of periods')).toHaveAttribute('aria-valuemax', '3')
})

it('selects an active transport provider from the existing list and persists the link', async () => {
  const providers: ServiceProvider[] = [
    { id: 'transport-a', name: 'Transport A', categories: ['transport'], active: true },
    { id: 'inactive', name: 'Inactive provider', categories: ['transport'], active: false },
    { id: 'hotel', name: 'Hotel provider', categories: ['accommodation'], active: true }
  ]
  const item = { ...newPackage(), name: 'Provider link' }
  item.editor!.services = [
    {
      id: 'service-a',
      category: 'transportation',
      transportType: 'intercity',
      transportMode: 'bus',
      description: 'Airport transfer',
      included: true
    }
  ]
  const onChange = vi.fn<(value: HajjPackage) => void>()
  render(
    <App>
      <PackageServicesStep item={item} onChange={onChange} providers={providers} />
    </App>
  )
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Transport service provider' }))
  fireEvent.click(await screen.findByText('Transport A'))
  const selected = onChange.mock.lastCall![0]
  expect(selected.editor!.services[0].providerId).toBe('transport-a')
  expect(screen.queryByText('Inactive provider')).not.toBeInTheDocument()
  expect(screen.queryByText('Hotel provider')).not.toBeInTheDocument()
  usePackageStore.setState({ providers, packages: [], blocks: [] })
  usePackageStore.getState().savePackage(selected)
  await usePackageStore.persist.rehydrate()
  expect(usePackageStore.getState().packages[0].editor!.services[0].providerId).toBe('transport-a')
  expect(() =>
    usePackageStore.getState().savePackage({
      ...selected,
      editor: {
        ...selected.editor!,
        services: [{ ...selected.editor!.services[0], providerId: 'inactive' }]
      }
    })
  ).toThrow('invalidTransportProvider')
  expect(() =>
    usePackageStore.getState().savePackage({
      ...selected,
      editor: {
        ...selected.editor!,
        services: [{ ...selected.editor!.services[0], providerId: 'missing' }]
      }
    })
  ).toThrow('invalidTransportProvider')
})
