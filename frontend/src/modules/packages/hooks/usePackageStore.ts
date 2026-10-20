import { migratePackageState, upgradePackage } from '../utils/migration'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { z } from 'zod'
import type {
  HajjPackage,
  OperationsBlock,
  PackageDemoData,
  ServiceProvider
} from '../types/domain'
import {
  packageDemoSchema,
  packageSchema,
  providerSchema,
  blockSchema
} from '../validations/schemas'
import { canAssignPackage, matchesBlock } from '../utils/domain'
import { seedPackageData } from '../utils/seed'

export const PACKAGE_STORAGE_KEY = 'ithraa-b2c-packages-v1'
export const usePackageStorageStatus = create<{ error: boolean }>(() => ({ error: false }))
let storageBlocked = false

const packageStorage: StateStorage = {
  getItem: (key) => {
    try {
      const saved = localStorage.getItem(key)
      if (saved === null) return null
      try {
        const parsed = JSON.parse(saved) as { version?: unknown; state?: unknown }
        migratePackageState(parsed.state, Number(parsed.version))
      } catch {
        storageBlocked = true
        usePackageStorageStatus.setState({ error: true })
      }
      return saved
    } catch {
      storageBlocked = true
      usePackageStorageStatus.setState({ error: true })
      return null
    }
  },
  setItem: (key, value) => {
    if (storageBlocked) return
    try {
      localStorage.setItem(key, value)
      usePackageStorageStatus.setState({ error: false })
    } catch {
      usePackageStorageStatus.setState({ error: true })
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      usePackageStorageStatus.setState({ error: true })
    }
  }
}

interface PackageStore extends PackageDemoData {
  savePackage: (item: HajjPackage) => void
  archivePackage: (id: string) => void
  saveProvider: (item: ServiceProvider) => void
  saveBlock: (item: OperationsBlock) => void
}

/** Persists package, provider, and block demo data and enforces their relationships. @returns Zustand store hook. */
export const usePackageStore = create<PackageStore>()(
  persist(
    (set, get) => ({
      ...{ ...seedPackageData(), packages: seedPackageData().packages.map(upgradePackage) },
      savePackage: (candidate) => {
        const item = packageSchema.parse(candidate)
        const state = get()
        const provider = state.providers.find((entry) => entry.id === item.providerId)
        if (item.providerId && !provider) throw new Error('missingProvider')
        if (
          state.blocks.some(
            (block) =>
              block.packageId === item.id && !matchesBlock(item, block.season, block.pilgrimType)
          )
        )
          throw new Error('packageInUseMismatch')
        set((current) => ({
          packages: current.packages.some((entry) => entry.id === item.id)
            ? current.packages.map((entry) => (entry.id === item.id ? item : entry))
            : [...current.packages, item]
        }))
      },
      archivePackage: (id) => {
        const state = get()
        if (!state.packages.some((item) => item.id === id)) throw new Error('packageMissing')
        set((current) => ({
          packages: current.packages.map((item) =>
            item.id === id ? { ...item, status: 'archived' } : item
          )
        }))
      },
      saveProvider: (candidate) => {
        const item = providerSchema.parse(candidate)
        set((current) => ({
          providers: current.providers.some((entry) => entry.id === item.id)
            ? current.providers.map((entry) => (entry.id === item.id ? item : entry))
            : [...current.providers, item]
        }))
      },
      saveBlock: (candidate) => {
        const block = blockSchema.parse(candidate)
        const state = get()
        const existingBlock = state.blocks.find((entry) => entry.id === block.id)
        const duplicate = state.blocks.some(
          (entry) =>
            entry.id !== block.id &&
            entry.code.toLowerCase() === block.code.toLowerCase() &&
            entry.season === block.season
        )
        if (duplicate) throw new Error('duplicateBlockCode')
        if (block.packageId) {
          const item = state.packages.find((entry) => entry.id === block.packageId)
          const keepingExistingAssignment = existingBlock?.packageId === block.packageId
          if (!item || (!keepingExistingAssignment && !canAssignPackage(item)))
            throw new Error('packageUnavailable')
          if (!matchesBlock(item, block.season, block.pilgrimType))
            throw new Error('packageMismatch')
        }
        set((current) => ({
          blocks: current.blocks.some((entry) => entry.id === block.id)
            ? current.blocks.map((entry) => (entry.id === block.id ? block : entry))
            : [...current.blocks, block]
        }))
      }
    }),
    {
      name: PACKAGE_STORAGE_KEY,
      version: 4,
      migrate: (state, version) => migratePackageState(state, version),
      storage: createJSONStorage(() => packageStorage),
      partialize: ({ packages, providers, blocks }) => ({ packages, providers, blocks }),
      merge: (saved, current) => {
        if (saved === undefined) return current
        const parsed = packageDemoSchema.safeParse(saved)
        if (!parsed.success) {
          storageBlocked = true
          usePackageStorageStatus.setState({ error: true })
          return current
        }
        return { ...current, ...parsed.data }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          storageBlocked = true
          usePackageStorageStatus.setState({ error: true })
        }
      }
    }
  )
)

if (!storageBlocked && packageStorage.getItem(PACKAGE_STORAGE_KEY) === null)
  usePackageStore.setState({})

/** Safely parses persisted package state for store-level tests. @param value - Raw storage value. @returns Validated package data or undefined. */
export function parsePackageState(value: unknown): PackageDemoData | undefined {
  const result = z.object({ state: packageDemoSchema }).safeParse(value)
  return result.success ? result.data.state : undefined
}
