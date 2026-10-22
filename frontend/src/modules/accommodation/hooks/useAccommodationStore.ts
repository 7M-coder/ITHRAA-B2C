import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Accommodation } from '../types/domain'
import { accommodationWriteSchema, accommodationsSchema } from '../validations/schemas'
import { createDemoAccommodations } from '../utils/demoData'

// Accommodation storage is isolated from other demo modules.
export const ACCOMMODATION_STORAGE_KEY = 'ithraa-b2c-accommodation-v1'
export const useAccommodationStorageStatus = create<{ error: boolean }>(() => ({ error: false }))
let blocked = false

const storage: StateStorage = {
  getItem: (key) => {
    try {
      const saved = localStorage.getItem(key)
      if (saved === null) return null
      const envelope: unknown = JSON.parse(saved)
      if (
        !envelope ||
        typeof envelope !== 'object' ||
        !('version' in envelope) ||
        envelope.version !== 1 ||
        !('state' in envelope) ||
        !envelope.state ||
        typeof envelope.state !== 'object' ||
        !('records' in envelope.state)
      )
        throw new Error('invalidStorage')
      return saved
    } catch {
      blocked = true
      useAccommodationStorageStatus.setState({ error: true })
      return null
    }
  },
  setItem: (key, value) => {
    if (blocked) return
    try {
      localStorage.setItem(key, value)
      useAccommodationStorageStatus.setState({ error: false })
    } catch {
      useAccommodationStorageStatus.setState({ error: true })
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      useAccommodationStorageStatus.setState({ error: true })
    }
  }
}

interface AccommodationStore {
  records: Accommodation[]
  demoSeeded: boolean
  saveAccommodation: (request: Accommodation) => void
}

/** Persists and manages accommodation records. @returns Zustand store hook. */
export const useAccommodationStore = create<AccommodationStore>()(
  persist(
    (set) => ({
      records: [],
      demoSeeded: false,
      saveAccommodation: (candidate) => {
        const request = accommodationWriteSchema.parse(candidate)
        if (blocked || useAccommodationStorageStatus.getState().error) throw new Error('storage')
        set((state) => ({
          records: state.records.some((item) => item.id === request.id)
            ? state.records.map((item) => (item.id === request.id ? request : item))
            : [...state.records, request]
        }))
      }
    }),
    {
      name: ACCOMMODATION_STORAGE_KEY,
      version: 1,
      migrate: () => {
        blocked = true
        useAccommodationStorageStatus.setState({ error: true })
        throw new Error('storageVersion')
      },
      storage: createJSONStorage(() => storage),
      partialize: ({ records, demoSeeded }) => ({ records, demoSeeded }),
      merge: (saved, current) => {
        if (saved === undefined) return current
        const parsed = accommodationsSchema.safeParse(
          (saved as { records?: unknown } | undefined)?.records
        )
        const demoSeeded = (saved as { demoSeeded?: unknown })?.demoSeeded
        if (!parsed.success || (demoSeeded !== undefined && typeof demoSeeded !== 'boolean')) {
          blocked = true
          useAccommodationStorageStatus.setState({ error: true })
          return current
        }
        return { ...current, records: parsed.data, demoSeeded: demoSeeded === true }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          blocked = true
          useAccommodationStorageStatus.setState({ error: true })
        }
      }
    }
  )
)

// Seed once after synchronous hydration, preserving existing records and unreadable storage.
if (
  !blocked &&
  !useAccommodationStorageStatus.getState().error &&
  !useAccommodationStore.getState().demoSeeded
) {
  useAccommodationStore.setState((state) => ({
    records: [
      ...state.records,
      ...createDemoAccommodations().filter(
        (demo) => !state.records.some((record) => record.id === demo.id)
      )
    ],
    demoSeeded: true
  }))
}
