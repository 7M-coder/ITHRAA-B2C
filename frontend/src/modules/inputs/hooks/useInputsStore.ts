import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { InternationalFlightRequest } from '../types/domain'
import { flightRequestSchema, flightRequestsSchema } from '../validations/schemas'
import { migrateFlightState } from '../utils/migration'

// A separate key keeps earlier per-pilgrim flight records intact; their shape is unrelated to PNR requests.
export const INPUTS_STORAGE_KEY = 'ithraa-b2c-flight-requests-v1'
export const useInputsStorageStatus = create<{ error: boolean }>(() => ({ error: false }))
let blocked = false

const storage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      blocked = true
      useInputsStorageStatus.setState({ error: true })
      return null
    }
  },
  setItem: (key, value) => {
    if (blocked) throw new Error('storage')
    try {
      localStorage.setItem(key, value)
      useInputsStorageStatus.setState({ error: false })
    } catch {
      useInputsStorageStatus.setState({ error: true })
      throw new Error('storage')
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      useInputsStorageStatus.setState({ error: true })
    }
  }
}

interface InputsStore {
  requests: InternationalFlightRequest[]
  saveRequest: (request: InternationalFlightRequest) => void
  deleteRequest: (id: string) => void
}

/** Persists and manages international flight booking requests. @returns Zustand store hook. */
export const useInputsStore = create<InputsStore>()(
  persist(
    (set, get) => ({
      requests: [],
      saveRequest: (candidate) => {
        const request = flightRequestSchema.parse(candidate)
        if (blocked) throw new Error('storage')
        const requests = get().requests.some((item) => item.id === request.id)
          ? get().requests.map((item) => (item.id === request.id ? request : item))
          : [...get().requests, request]
        storage.setItem(INPUTS_STORAGE_KEY, JSON.stringify({ state: { requests }, version: 2 }))
        set({ requests })
      },
      deleteRequest: (id) => {
        if (blocked) throw new Error('storage')
        const requests = get().requests.filter((item) => item.id !== id)
        storage.setItem(INPUTS_STORAGE_KEY, JSON.stringify({ state: { requests }, version: 2 }))
        set({ requests })
      }
    }),
    {
      name: INPUTS_STORAGE_KEY,
      version: 2,
      migrate: migrateFlightState,
      storage: createJSONStorage(() => storage),
      partialize: ({ requests }) => ({ requests }),
      merge: (saved, current) => {
        if (saved === undefined) return current
        const parsed = flightRequestsSchema.safeParse(
          (saved as { requests?: unknown } | undefined)?.requests
        )
        if (!parsed.success) {
          blocked = true
          useInputsStorageStatus.setState({ error: true })
          return current
        }
        return { ...current, requests: parsed.data }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          blocked = true
          useInputsStorageStatus.setState({ error: true })
        }
      }
    }
  )
)
