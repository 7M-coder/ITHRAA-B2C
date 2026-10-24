import { expect, it, vi } from 'vitest'
import { record } from './fixtures'
const key = 'ithraa-b2c-accommodation-v1'
it('creates, updates, rehydrates and preserves empty inventory', async () => {
  localStorage.clear()
  localStorage.setItem(
    key,
    JSON.stringify({ version: 1, state: { records: [], demoSeeded: true } })
  )
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

it('persists a contract value independently of bed pricing', async () => {
  localStorage.clear()
  localStorage.setItem(
    key,
    JSON.stringify({ version: 1, state: { records: [], demoSeeded: true } })
  )
  vi.resetModules()
  const { useAccommodationStore: store } = await import('../hooks/useAccommodationStore')
  store.getState().saveAccommodation({ ...record, contractPrice: 123 })
  expect(store.getState().records[0].contractPrice).toBe(123)
  await store.persist.rehydrate()
  expect(store.getState().records[0].contractPrice).toBe(123)
})

it('seeds both cities once and preserves edits and an intentionally emptied list', async () => {
  localStorage.clear()
  vi.resetModules()
  let { useAccommodationStore: store } = await import('../hooks/useAccommodationStore')
  expect(store.getState().records).toHaveLength(4)
  expect(new Set(store.getState().records.map((item) => item.city)).size).toBe(2)
  const demo = store.getState().records[0]
  store.getState().saveAccommodation({ ...demo, name: 'Edited demo' })
  vi.resetModules()
  store = (await import('../hooks/useAccommodationStore')).useAccommodationStore
  expect(store.getState().records).toHaveLength(4)
  expect(store.getState().records[0].name).toBe('Edited demo')
  store.setState({ records: [] })
  vi.resetModules()
  store = (await import('../hooks/useAccommodationStore')).useAccommodationStore
  expect(store.getState().records).toEqual([])
})

it('adds demo housing to existing local data without replacing user records', async () => {
  localStorage.clear()
  localStorage.setItem(key, JSON.stringify({ version: 1, state: { records: [record] } }))
  vi.resetModules()
  const { useAccommodationStore: store } = await import('../hooks/useAccommodationStore')
  expect(store.getState().records).toHaveLength(5)
  expect(store.getState().records[0]).toMatchObject({
    ...record,
    contractPrice: undefined,
    historical: { contractPrice: record.contractPrice }
  })
  await store.persist.rehydrate()
  expect(store.getState().records).toHaveLength(5)
})
