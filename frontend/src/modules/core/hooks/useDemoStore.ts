import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { z } from 'zod'
import type { Asset, AssetStatus, DemoData, Employee } from '../types/domain'
import { employeeSchema, assetSchema } from '../validations/schemas'
import { canClear } from '../utils/domain'
import { seedData } from '../utils/seed'
export const STORAGE_KEY = 'ithraa-hr-demo-v1'
export const useStorageStatus = create<{ error: boolean }>(() => ({ error: false }))
let blocked = false
const storage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      blocked = true
      useStorageStatus.setState({ error: true })
      return null
    }
  },
  setItem: (name, value) => {
    if (blocked) return
    try {
      localStorage.setItem(name, value)
    } catch {
      useStorageStatus.setState({ error: true })
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      useStorageStatus.setState({ error: true })
    }
  }
}
const persistedSchema = z
  .object({
    employees: z.array(employeeSchema),
    assets: z.array(assetSchema),
    clearances: z.array(z.object({ employeeId: z.string(), issuedAt: z.string() }))
  })
  .superRefine((data, ctx) => {
    const ids = new Set(data.employees.map((e) => e.id))
    if (
      ids.size !== data.employees.length ||
      new Set(data.assets.map((a) => a.id)).size !== data.assets.length ||
      data.assets.some((a) => !ids.has(a.employeeId)) ||
      data.clearances.some((c) => !ids.has(c.employeeId))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid relationships' })
  })
interface DemoStore extends DemoData {
  saveEmployee: (employee: Employee) => void
  addAsset: (asset: Asset) => void
  changeAssetStatus: (id: string, status: Exclude<AssetStatus, 'Active'>) => void
  issueClearance: (id: string) => boolean
}
/** Shared demo store. Seeds once and persists every business mutation. @returns Zustand store hook. */
export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...seedData(),
      saveEmployee: (employee) => {
        const value = employeeSchema.parse(employee)
        set((s) => ({
          employees: s.employees.some((e) => e.id === value.id)
            ? s.employees.map((e) => (e.id === value.id ? value : e))
            : [...s.employees, value]
        }))
      },
      addAsset: (asset) => {
        const value = assetSchema.parse(asset)
        const s = get()
        if (
          !s.employees.some((e) => e.id === value.employeeId) ||
          s.assets.some((a) => a.id === value.id) ||
          s.clearances.some((c) => c.employeeId === value.employeeId)
        )
          throw new Error('Invalid assignment')
        set({ assets: [...s.assets, { ...value, status: 'Active' }] })
      },
      changeAssetStatus: (id, status) => {
        if (status !== 'Returned' && status !== 'Lost') return
        set((s) => ({
          assets: s.assets.map((a) => (a.id === id && a.status === 'Active' ? { ...a, status } : a))
        }))
      },
      issueClearance: (id) => {
        const s = get()
        const e = s.employees.find((e) => e.id === id)
        if (!e || !canClear(e, s.assets) || s.clearances.some((c) => c.employeeId === id))
          return false
        set({
          clearances: [...s.clearances, { employeeId: id, issuedAt: new Date().toISOString() }]
        })
        return true
      }
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: ({ employees, assets, clearances }) => ({ employees, assets, clearances }),
      merge: (saved, current) => {
        if (saved === undefined) return current
        const result = persistedSchema.safeParse(saved)
        if (!result.success) {
          blocked = true
          useStorageStatus.setState({ error: true })
          return current
        }
        return { ...current, ...result.data }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          blocked = true
          useStorageStatus.setState({ error: true })
        }
      }
    }
  )
)

// Persist the first-run seed immediately, without replacing unreadable saved data.
if (!blocked && storage.getItem(STORAGE_KEY) === null) useDemoStore.setState({})
