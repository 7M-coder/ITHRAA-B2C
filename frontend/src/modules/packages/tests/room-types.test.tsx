import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { App } from 'antd'
import i18n from 'i18next'
import { PackageStaysStep } from '../components/PackageStaysStep'
import { completePackage } from './fixtures'
import { editorData, servicePricing } from '../utils/finance'
import { packageSchema } from '../validations/schemas'
import { migratePackageState } from '../utils/migration'
import { seedPackageData } from '../utils/seed'
import { usePackageStore } from '../hooks/usePackageStore'
import type { HajjPackage } from '../types/domain'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  usePackageStore.setState({ providers: seedPackageData().providers, packages: [], blocks: [] })
})

it('selects room types independently per stay and preserves them across reload without changing service prices', async () => {
  const item = completePackage()
  item.status = 'draft'
  const before = servicePricing(item).total
  const onChange = vi.fn<(value: HajjPackage) => void>()
  const view = render(
    <App>
      <PackageStaysStep item={item} onChange={onChange} />
    </App>
  )
  expect(screen.getAllByRole('checkbox')).toHaveLength(6)
  fireEvent.click(screen.getAllByRole('checkbox', { name: 'Double (2 beds, 2 people)' })[0])
  const selected = onChange.mock.lastCall![0]
  view.rerender(
    <App>
      <PackageStaysStep item={selected} onChange={onChange} />
    </App>
  )
  fireEvent.click(screen.getAllByRole('checkbox', { name: 'Triple (3 beds, 3 people)' })[0])
  const updated = onChange.mock.lastCall![0]
  expect(editorData(updated).stays[0].roomTypes).toEqual([2, 3])
  expect(editorData(updated).stays[1].roomTypes).toEqual([])
  expect(servicePricing(updated).total).toBe(before)
  usePackageStore.getState().savePackage(updated)
  await usePackageStore.persist.rehydrate()
  expect(usePackageStore.getState().packages[0].editor!.stays[0].roomTypes).toEqual([2, 3])
  expect(servicePricing(usePackageStore.getState().packages[0]).total).toBe(before)
  expect(screen.queryByLabelText('Allocated beds')).not.toBeInTheDocument()
})

it('restores archived main room types by stay ID while preserving deliberate empty selections and prices', () => {
  const seed = seedPackageData()
  const item = completePackage()
  item.id = seed.packages[0].id
  delete item.editor!.stays[0].roomTypes
  item.editor!.previousPricing = {
    rooms: item.editor!.stays.map((stay) => ({
      id: stay.id,
      rooms: [
        { occupancy: 2, enabled: true, amount: 100 },
        { occupancy: 3, enabled: false, amount: 200 },
        { occupancy: 4, enabled: true, amount: 300 }
      ]
    }))
  }
  const migrated = migratePackageState({ ...seed, packages: [item] }, 7).packages[0]
  expect(migrated.editor!.stays[0].roomTypes).toEqual([2, 4])
  expect(migrated.editor!.stays[1].roomTypes).toEqual([])
  expect(migrated.editor!.servicePrices).toEqual(item.editor!.servicePrices)
  expect(migrated.editor!.previousPricing).toEqual(item.editor!.previousPricing)
  expect(item.editor!.stays[0].roomTypes).toBeUndefined()
})

it('rejects unsupported and duplicated room types', () => {
  const item = completePackage()
  for (const roomTypes of [[1], [2, 2], [5]]) {
    const candidate = {
      ...item,
      editor: { ...item.editor, stays: [{ ...item.editor!.stays[0], roomTypes }] }
    }
    expect(packageSchema.safeParse(candidate).success).toBe(false)
  }
})
