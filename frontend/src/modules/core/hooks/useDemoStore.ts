import { normalizeEmployee } from '../../employees/utils/profile'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { z } from 'zod'
import type { Asset, AssetStatus, DemoData, Employee } from '../types/domain'
import { employeeSchema, employeeCreateSchema, assetSchema } from '../validations/schemas'
import { canClear } from '../utils/domain'
import { seedData } from '../utils/seed'
import { inventorySchema } from '../../custody/validations/schemas'
import { applyCustodyCommand } from '../../custody/utils/workflow'
import type { CustodyCommand, CustodyActor } from '../../custody/types/workflow'
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
      useStorageStatus.setState({ error: false })
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
    inventory: z.array(inventorySchema).default([]),
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
    for (const asset of data.assets) {
      const w = asset.workflow
      if (!w) continue
      if (
        (asset.type === 'Advance' && w.amount === null) ||
        (asset.type !== 'Advance' &&
          (w.inventoryId
            ? !data.inventory.some((i) => i.id === w.inventoryId)
            : !(
                w.phase === 'closed' &&
                w.history.some((h) => ['employeeReturned', 'managerReceived'].includes(h.action))
              ))) ||
        ['closed', 'cancelled'].includes(w.phase) !== (asset.status === 'Returned') ||
        new Set(w.purchases.map((p) => p.id)).size !== w.purchases.length
      )
        ctx.addIssue({ code: 'custom', message: 'Invalid custody' })
    }
    if (
      new Set(data.inventory.map((i) => i.id)).size !== data.inventory.length ||
      new Set(data.inventory.map((i) => i.serial.toLowerCase())).size !== data.inventory.length
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid inventory' })
  })
interface DemoStore extends DemoData {
  custodyAction: (command: CustodyCommand, actor: CustodyActor) => void
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
      inventory: [],
      custodyAction: (command, actor) => set(applyCustodyCommand(get(), command, actor)),
      saveEmployee: (employee) => {
        const schema = get().employees.some((e) => e.id === employee.id)
          ? employeeSchema
          : employeeCreateSchema
        const value = normalizeEmployee(schema.parse(normalizeEmployee(employee)))
        set((s) => ({
          employees: s.employees.some((e) => e.id === value.id)
            ? s.employees.map((e) => (e.id === value.id ? value : e))
            : [...s.employees, value]
        }))
      },
      addAsset: (asset) => {
        const value = assetSchema.parse(asset)
        if (value.workflow) throw new Error('Use custody workflow')
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
        if (get().assets.find((a) => a.id === id)?.workflow) throw new Error('Use custody workflow')
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
      version: 2,
      migrate: (saved, version) => {
        if (version !== 1) throw new Error('Unsupported storage version')
        return persistedSchema.parse(saved)
      },
      storage: createJSONStorage(() => storage),
      partialize: ({ employees, assets, clearances, inventory }) => ({
        employees,
        assets,
        clearances,
        inventory: inventory ?? []
      }),
      merge: (saved, current) => {
        if (saved === undefined) return current
        const result = persistedSchema.safeParse(saved)
        if (!result.success) {
          blocked = true
          useStorageStatus.setState({ error: true })
          return current
        }
        return {
          ...current,
          ...result.data,
          employees: result.data.employees.map(normalizeEmployee)
        }
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
