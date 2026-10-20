import { beforeEach, describe, expect, it, vi } from 'vitest'
import { completePackage } from './fixtures'
import { editorData } from '../utils/finance'
import { migratePackageState } from '../utils/migration'
import { seedPackageData } from '../utils/seed'

const KEY = 'ithraa-b2c-packages-v1'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})

describe('persisted package state', () => {
  it('seeds once and retains package edits across reloads', async () => {
    const first = await import('../hooks/usePackageStore')
    expect(first.usePackageStorageStatus.getState().error).toBe(false)
    const item = first.usePackageStore.getState().packages[0]
    first.usePackageStore.getState().savePackage({ ...item, name: 'باقة محفوظة' })
    vi.resetModules()
    const reload = await import('../hooks/usePackageStore')
    expect(reload.usePackageStore.getState().packages[0].name).toBe('باقة محفوظة')
    expect(reload.usePackageStore.getState().providers).toHaveLength(2)
  })

  it.each([
    JSON.stringify({ version: 1, state: { packages: 'invalid', providers: [], blocks: [] } }),
    'not json'
  ])('preserves unreadable saved data and reports a storage warning', async (saved) => {
    localStorage.setItem(KEY, saved)
    const { usePackageStore, usePackageStorageStatus } = await import('../hooks/usePackageStore')
    expect(usePackageStorageStatus.getState().error).toBe(true)
    usePackageStore
      .getState()
      .saveProvider({ id: 'provider-new', name: 'اختبار', categories: ['other'], active: true })
    expect(localStorage.getItem(KEY)).toBe(saved)
  })

  it('rejects a package edit that makes a linked block incompatible', async () => {
    const { usePackageStore } = await import('../hooks/usePackageStore')
    const state = usePackageStore.getState()
    const item = state.packages.find((entry) => entry.id === 'package-demo-1')!
    expect(() => state.savePackage({ ...item, season: '1449' })).toThrow('packageInUseMismatch')
  })

  it('creates a package with optional service sections omitted', async () => {
    const { usePackageStore } = await import('../hooks/usePackageStore')
    const source = usePackageStore.getState().packages[0]
    const created = { ...source, id: 'package-new', name: 'قالب جديد', services: {} }
    usePackageStore.getState().savePackage(created)
    expect(usePackageStore.getState().packages.find((item) => item.id === created.id)).toEqual(
      created
    )
  })

  it('allows package reuse while enforcing each block season and pilgrim type', async () => {
    const { usePackageStore } = await import('../hooks/usePackageStore')
    const state = usePackageStore.getState()
    const secondBlock = {
      id: 'block-new',
      code: 'D-02',
      name: 'بلوك ثان',
      season: '1448',
      pilgrimType: 'international' as const,
      packageId: 'package-demo-1'
    }
    state.savePackage({ ...completePackage(), id: 'package-demo-1' })
    state.saveBlock(secondBlock)
    expect(
      usePackageStore.getState().blocks.find((block) => block.id === 'block-new')?.packageId
    ).toBe('package-demo-1')
    expect(() =>
      state.saveBlock({
        ...secondBlock,
        id: 'block-invalid',
        code: 'I-02',
        season: '1449'
      })
    ).toThrow('packageMismatch')
  })

  it('keeps an archived package linked for historical block details', async () => {
    const { usePackageStore } = await import('../hooks/usePackageStore')
    usePackageStore.getState().archivePackage('package-demo-1')
    const state = usePackageStore.getState()
    expect(state.packages.find((item) => item.id === 'package-demo-1')?.status).toBe('archived')
    expect(state.blocks.find((block) => block.id === 'block-demo-1')?.packageId).toBe(
      'package-demo-1'
    )
  })

  it('supports intentionally empty collections without reseeding', async () => {
    const empty = { packages: [], providers: [], blocks: [] }
    localStorage.setItem(KEY, JSON.stringify({ version: 1, state: empty }))
    const { usePackageStore } = await import('../hooks/usePackageStore')
    expect(usePackageStore.getState().packages).toEqual([])
    expect(seedPackageData().providers).toHaveLength(2)
  })
})

it('migrates v1 without changing IDs, provider relationships or historical block links', async () => {
  const seed = seedPackageData()
  const old = { ...seed, packages: seed.packages.map((item) => ({ ...item, price: 1400 })) }
  localStorage.setItem(KEY, JSON.stringify({ state: old, version: 1 }))
  const { usePackageStore } = await import('../hooks/usePackageStore')
  const current = usePackageStore.getState()
  expect(current.packages[0].id).toBe(old.packages[0].id)
  expect(current.packages[0].status).toBe('draft')
  expect(current.blocks).toEqual(old.blocks)
  expect(current.providers).toEqual(old.providers)
  expect(editorData(current.packages[0]).servicePrices).toHaveLength(13)
  expect('price' in current.packages[0]).toBe(false)
  expect(current.packages[0].services).toEqual(old.packages[0].services)
  expect(() =>
    current.saveBlock({
      id: 'new',
      code: 'NEW',
      name: 'New block',
      season: '1448',
      pilgrimType: 'international',
      packageId: old.packages[0].id
    })
  ).toThrow('packageUnavailable')
  current.saveBlock({ ...current.blocks[0], name: 'Existing assignment preserved' })
  expect(JSON.parse(localStorage.getItem(KEY)!).version).toBe(6)
})
it('migrates v5 by removing room options and room taxes while retaining service prices and hotel stays', () => {
  const seed = seedPackageData()
  const packageData = completePackage()
  packageData.id = seed.packages[0].id
  const oldEditor = {
    ...editorData(packageData),
    bedTaxes: { vat: 15, accommodation: 5, collection: 2, city: 3 },
    stays: editorData(packageData).stays.map((stay) => ({
      ...stay,
      rooms: [
        { occupancy: 4, enabled: true, beds: 46, amount: 100, basis: 'bed_night', tax: 'excluded' }
      ]
    })),
    options: [{ id: 'old-option', name: 'Old option', selections: {}, notes: '' }]
  }
  const oldPackage = { ...packageData, editor: oldEditor }
  const migrated = migratePackageState({ ...seed, packages: [oldPackage] }, 5)
  const result = migrated.packages[0]
  expect(result.editor?.stays).toHaveLength(2)
  expect(result.editor?.stays[0]).not.toHaveProperty('rooms')
  expect(result.editor).not.toHaveProperty('options')
  expect(result.editor).not.toHaveProperty('bedTaxes')
  expect(editorData(result).servicePrices).toEqual(editorData(packageData).servicePrices)
  expect(migrated.blocks).toEqual(seed.blocks)
})
it('persists service prices and stable package references after a reload', async () => {
  let mod = await import('../hooks/usePackageStore')
  const p = completePackage()
  p.status = 'draft'
  editorData(p).servicePrices[0].amount = 123
  mod.usePackageStore.getState().savePackage(p)
  vi.resetModules()
  mod = await import('../hooks/usePackageStore')
  const saved = mod.usePackageStore.getState().packages.find((x) => x.id === p.id)!
  expect(editorData(saved)).toEqual(editorData(p))
  expect(editorData(saved).servicePrices[0].amount).toBe(123)
})
it('preserves unsupported future-version storage', async () => {
  const raw = JSON.stringify({ version: 99, state: seedPackageData() })
  localStorage.setItem(KEY, raw)
  const { usePackageStore, usePackageStorageStatus } = await import('../hooks/usePackageStore')
  usePackageStore.getState().archivePackage('package-demo-1')
  expect(usePackageStorageStatus.getState().error).toBe(true)
  expect(localStorage.getItem(KEY)).toBe(raw)
})
it('reports quota failures without replacing the saved data', async () => {
  const { usePackageStore, usePackageStorageStatus } = await import('../hooks/usePackageStore')
  const raw = localStorage.getItem(KEY)
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  try {
    usePackageStore.getState().archivePackage('package-demo-1')
    expect(usePackageStorageStatus.getState().error).toBe(true)
    expect(localStorage.getItem(KEY)).toBe(raw)
  } finally {
    spy.mockRestore()
  }
})
it('rejects broken relationships rather than guessing their meaning', () => {
  const old = seedPackageData()
  old.blocks[0].packageId = 'missing'
  expect(() => migratePackageState(old, 1)).toThrow()
})

it.each([1, 2])(
  'migrates domestic records in version %s to international without losing details or links',
  async (version) => {
    const seed = seedPackageData()
    const packages =
      version === 1
        ? seed.packages.map((p) => ({ ...p, price: 1400 }))
        : seed.packages.map((p) => ({
            ...p,
            price: 1400,
            editor: {
              ...editorData(completePackage()),
              servicePrices: undefined,
              bedTaxes: { vat: 15, accommodation: 5, collection: 2, city: 3 },
              mode: 'cost_draft',
              costs: [],
              approval: { by: '', date: '', reference: '' },
              stays: editorData(completePackage()).stays.map((stay) => ({
                ...stay,
                rooms: [
                  {
                    occupancy: 4,
                    enabled: true,
                    beds: 46,
                    amount: 100,
                    basis: 'bed_night',
                    tax: 'excluded'
                  }
                ]
              })),
              options: [
                {
                  id: 'legacy-option',
                  name: 'Legacy',
                  selections: {},
                  approvedAmount: null,
                  tax: 'unknown' as const,
                  notes: ''
                }
              ],
              needsReview: true
            },
            status: 'draft' as const
          }))
    const old = {
      ...seed,
      packages: packages.map((p) => ({ ...p, pilgrimType: 'domestic' })),
      blocks: seed.blocks.map((b) => ({ ...b, pilgrimType: 'domestic' }))
    }
    localStorage.setItem(KEY, JSON.stringify({ state: old, version }))
    const { usePackageStore, usePackageStorageStatus } = await import('../hooks/usePackageStore')
    const current = usePackageStore.getState()
    expect(usePackageStorageStatus.getState().error).toBe(false)
    expect(current.packages.every((p) => p.pilgrimType === 'international')).toBe(true)
    expect(current.blocks.every((b) => b.pilgrimType === 'international')).toBe(true)
    expect(current.packages.map((p) => p.id)).toEqual(old.packages.map((p) => p.id))
    expect(current.blocks.map((b) => b.packageId)).toEqual(old.blocks.map((b) => b.packageId))
    expect(current.providers).toEqual(old.providers)
    expect(current.packages[0].services).toEqual(old.packages[0].services)
    if (version === 2) expect(editorData(current.packages[0]).servicePrices).toHaveLength(13)
    expect(JSON.parse(localStorage.getItem(KEY)!).version).toBe(6)
  }
)

it('persists hotel periods, transport selections and service prices across reloads', async () => {
  const { withPeriods } = await import('../utils/periods')
  const { servicePricing } = await import('../utils/finance')
  let mod = await import('../hooks/usePackageStore')
  const p = completePackage()
  p.status = 'draft'
  p.providerId = ''
  const e = editorData(p)
  e.stays = [
    withPeriods(e.stays[0], [
      { id: 'period-one', checkIn: '2027-05-10', checkOut: '2027-05-12' },
      { id: 'period-two', checkIn: '2027-05-13', checkOut: '2027-05-15' },
      { id: 'period-three', checkIn: '2027-05-17', checkOut: '2027-05-20' }
    ])
  ]
  e.services = [
    {
      id: 'transport-one',
      category: 'transportation',
      transportType: 'intercity',
      transportMode: 'haramain_train',
      description: 'Between cities',
      included: true
    }
  ]
  mod.usePackageStore.getState().savePackage(p)
  vi.resetModules()
  mod = await import('../hooks/usePackageStore')
  const saved = mod.usePackageStore.getState().packages.find((item) => item.id === p.id)!
  expect(saved.editor).toEqual(e)
  expect(saved.providerId).toBe('')
  expect(servicePricing(saved).total).toBe(1150)
})
