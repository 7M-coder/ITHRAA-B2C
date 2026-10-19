import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    const source = seedPackageData().packages[0]
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
      pilgrimType: 'domestic' as const,
      packageId: 'package-demo-1'
    }
    state.saveBlock(secondBlock)
    expect(
      usePackageStore.getState().blocks.find((block) => block.id === 'block-new')?.packageId
    ).toBe('package-demo-1')
    expect(() =>
      state.saveBlock({
        ...secondBlock,
        id: 'block-invalid',
        code: 'I-02',
        pilgrimType: 'international'
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
