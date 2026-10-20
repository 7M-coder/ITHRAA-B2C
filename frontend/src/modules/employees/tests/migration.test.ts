import { expect, it, vi } from 'vitest'
import { seedData } from '@/modules/core/utils/seed'
import { payroll } from '@/modules/core/utils/domain'
it('loads legacy employees without resetting their custody, clearance, salary, or IDs', async () => {
  vi.resetModules()
  const seed = seedData()
  const employees = seed.employees.map((e) => ({
    ...e,
    nationalityCode: undefined,
    phone: undefined,
    email: undefined,
    department: undefined,
    startDate: undefined
  }))
  const clearances = [{ employeeId: 'employee-8', issuedAt: '2026-10-19T10:00:00Z' }]
  localStorage.setItem(
    'ithraa-hr-demo-v1',
    JSON.stringify({ version: 1, state: { employees, assets: seed.assets, clearances } })
  )
  const { useDemoStore, useStorageStatus } = await import('@/modules/core/hooks/useDemoStore')
  const state = useDemoStore.getState()
  expect(useStorageStatus.getState().error).toBe(false)
  expect(state.employees[0].nationalityCode).toBe('SA')
  expect(state.employees[2].nationalityCode).toBeUndefined()
  expect(state.assets).toEqual(seed.assets)
  expect(state.clearances).toEqual(clearances)
  expect(state.employees.map((e) => e.id)).toEqual(employees.map((e) => e.id))
  expect(state.employees.map(payroll)).toEqual(employees.map(payroll))
  state.saveEmployee({ ...state.employees[2], jobTitle: 'Updated legacy job' })
  vi.resetModules()
  const reload = await import('@/modules/core/hooks/useDemoStore')
  expect(reload.useDemoStore.getState().employees[2].jobTitle).toBe('Updated legacy job')
  expect(reload.useDemoStore.getState().employees[2].department).toBeUndefined()
})
