import { expect, it, vi } from 'vitest'
import { record } from './fixtures'
const key = 'ithraa-b2c-accommodation-v1'
it('creates, updates, rehydrates and preserves empty inventory', async () => {
  localStorage.clear()
  vi.resetModules()
  let { useAccommodationStore: store } = await import('../hooks/useAccommodationStore')
  store.getState().saveAccommodation(record)
  store.getState().saveAccommodation({ ...record, name: 'Updated' })
  expect(store.getState().records).toHaveLength(1)
  vi.resetModules()
  store = (await import('../hooks/useAccommodationStore')).useAccommodationStore
  expect(store.getState().records[0].name).toBe('Updated')
  expect(store.getState().records[0].contractPrice).toBe(record.contractPrice)
  expect(() => store.getState().saveAccommodation({ ...record, capacity: 1 })).toThrow()
  store.setState({ records: [] })
  await store.persist.rehydrate()
  expect(store.getState().records).toEqual([])
})
it.each([
  'broken json',
  '{}',
  JSON.stringify({ version: 1 }),
  JSON.stringify({ state: { records: [{ id: 'bad' }] }, version: 1 }),
  JSON.stringify({ state: { records: [] }, version: 99 })
])('protects unreadable or unsupported saved data', async (saved) => {
  localStorage.clear()
  localStorage.setItem(key, saved)
  vi.resetModules()
  const { useAccommodationStore: store, useAccommodationStorageStatus: status } =
    await import('../hooks/useAccommodationStore')
  expect(status.getState().error).toBe(true)
  expect(() => store.getState().saveAccommodation(record)).toThrow()
  expect(localStorage.getItem(key)).toBe(saved)
})
it('reports storage access failure', async () => {
  localStorage.clear()
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('unavailable')
  })
  vi.resetModules()
  const { useAccommodationStorageStatus: status } = await import('../hooks/useAccommodationStore')
  expect(status.getState().error).toBe(true)
  spy.mockRestore()
})

it('hydrates older housing without fabricating a price, then requires price on save', async () => {
  localStorage.clear()
  vi.resetModules()
  const legacy = {
    ...record,
    contractPrice: undefined,
    roomRates: undefined,
    pricingBasis: undefined,
    unifiedNumber: '001234'
  }
  localStorage.setItem(key, JSON.stringify({ version: 1, state: { records: [legacy] } }))
  const { useAccommodationStore: store, useAccommodationStorageStatus: status } =
    await import('../hooks/useAccommodationStore')
  expect(status.getState().error).toBe(false)
  expect(store.getState().records[0].contractPrice).toBeUndefined()
  expect(() => store.getState().saveAccommodation(legacy)).toThrow()
  store.getState().saveAccommodation(record)
  vi.resetModules()
  expect(
    (await import('../hooks/useAccommodationStore')).useAccommodationStore.getState().records[0]
      .contractPrice
  ).toBe(record.contractPrice)
})

it('rejects a mismatched contract without changing saved data', async () => {
  localStorage.clear()
  vi.resetModules()
  const { useAccommodationStore: store } = await import('../hooks/useAccommodationStore')
  store.getState().saveAccommodation(record)
  const saved = localStorage.getItem(key)
  expect(() =>
    store.getState().saveAccommodation({ ...record, contractPrice: record.contractPrice + 0.01 })
  ).toThrow()
  expect(localStorage.getItem(key)).toBe(saved)
  expect(store.getState().records[0].contractPrice).toBe(record.contractPrice)
  expect(store.getState().records[0].roomRates).toEqual(record.roomRates)
})
