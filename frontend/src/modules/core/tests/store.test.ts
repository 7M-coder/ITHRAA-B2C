import { beforeEach, describe, expect, it, vi } from 'vitest'
import { seedData } from '../utils/seed'
const KEY = 'ithraa-hr-demo-v1'
beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})
describe('persisted demo state', () => {
  it('seeds once without a first-run storage warning and preserves edits on reload', async () => {
    const first = await import('../hooks/useDemoStore')
    expect(first.useStorageStatus.getState().error).toBe(false)
    expect(localStorage.getItem(KEY)).not.toBeNull()
    const employee = first.useDemoStore.getState().employees[0]
    first.useDemoStore.getState().saveEmployee({ ...employee, fullName: 'Persisted Demo' })
    vi.resetModules()
    const reload = await import('../hooks/useDemoStore')
    expect(reload.useDemoStore.getState().employees[0].fullName).toBe('Persisted Demo')
    expect(reload.useDemoStore.getState().employees).toHaveLength(8)
  })
  it('preserves intentionally empty lists instead of re-seeding', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, state: { employees: [], assets: [], clearances: [] } })
    )
    const { useDemoStore } = await import('../hooks/useDemoStore')
    expect(useDemoStore.getState().employees).toEqual([])
    expect(useDemoStore.getState().assets).toEqual([])
  })
  it.each(['not json', JSON.stringify({ version: 1, state: { employees: 'invalid' } })])(
    'does not overwrite unreadable saved data',
    async (saved) => {
      localStorage.setItem(KEY, saved)
      const { useDemoStore, useStorageStatus } = await import('../hooks/useDemoStore')
      expect(useStorageStatus.getState().error).toBe(true)
      useDemoStore.getState().saveEmployee({ ...seedData().employees[0], fullName: 'Test edit' })
      expect(localStorage.getItem(KEY)).toBe(saved)
    }
  )
  it('enforces assignment relationships and one-way transitions', async () => {
    const { useDemoStore } = await import('../hooks/useDemoStore')
    useDemoStore.setState({ assets: seedData().assets })
    const store = useDemoStore.getState()
    expect(() => store.addAsset({ ...store.assets[0], id: 'new', employeeId: 'missing' })).toThrow()
    store.changeAssetStatus('asset-1', 'Returned')
    store.changeAssetStatus('asset-1', 'Lost')
    expect(useDemoStore.getState().assets.find((a) => a.id === 'asset-1')?.status).toBe('Returned')
  })
  it('blocks unsettled clearance, persists issuance, and prevents duplicate issuance and new custody', async () => {
    const { useDemoStore } = await import('../hooks/useDemoStore')
    useDemoStore.setState({ assets: seedData().assets })
    expect(useDemoStore.getState().issueClearance('employee-7')).toBe(false)
    expect(useDemoStore.getState().issueClearance('employee-8')).toBe(true)
    expect(useDemoStore.getState().issueClearance('employee-8')).toBe(false)
    expect(() =>
      useDemoStore
        .getState()
        .addAsset({ ...seedData().assets[0], id: 'new', employeeId: 'employee-8' })
    ).toThrow()
    vi.resetModules()
    const reload = await import('../hooks/useDemoStore')
    expect(reload.useDemoStore.getState().issueClearance('employee-8')).toBe(false)
    expect(reload.useDemoStore.getState().clearances).toHaveLength(1)
  })
  it('reports failed storage writes instead of silently claiming persistence', async () => {
    const { useDemoStore, useStorageStatus } = await import('../hooks/useDemoStore')
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    useDemoStore.getState().saveEmployee({ ...seedData().employees[0], fullName: 'Unsaved change' })
    expect(useStorageStatus.getState().error).toBe(true)
    spy.mockRestore()
  })
})
