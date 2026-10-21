import { beforeEach, expect, it, vi } from 'vitest'
import { seedData } from '../../core/utils/seed'
import { isoDate } from '../../core/utils/domain'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})
it('clears obsolete custody once on upgrade and preserves new invoices across reloads', async () => {
  const old = seedData()
  localStorage.setItem('ithraa-hr-demo-v1', JSON.stringify({ version: 1, state: old }))
  const { useDemoStore } = await import('../../core/hooks/useDemoStore')
  expect(useDemoStore.getState().assets).toEqual([])
  expect(useDemoStore.getState().employees).toEqual(old.employees)
  const manager = { role: 'manager' as const }
  const employee = { role: 'employee' as const, employeeId: 'employee-1' }
  const run = useDemoStore.getState().custodyAction
  run(
    {
      type: 'create',
      id: 'cash',
      kind: 'financial',
      employeeId: 'employee-1',
      description: 'Purchase advance',
      amount: 5000,
      dueDate: '2099-12-31'
    },
    manager
  )
  run(
    {
      type: 'purchase',
      id: 'cash',
      purchase: {
        id: 'invoice',
        supplier: 'Supplier',
        invoiceNumber: 'INV-1',
        date: isoDate(),
        items: [{ description: 'Office supplies', quantity: 2, unitPrice: 100 }],
        attachments: [
          {
            id: 'file',
            name: 'invoice.pdf',
            type: 'application/pdf',
            data: 'data:application/pdf;base64,JVBERi0xLjQ='
          }
        ],
        missingInvoiceReason: '',
        status: 'draft',
        reviewNote: ''
      }
    },
    employee
  )
  expect(() => useDemoStore.getState().changeAssetStatus('cash', 'Returned')).toThrow(
    'Use custody workflow'
  )
  vi.resetModules()
  const reloaded = await import('../../core/hooks/useDemoStore')
  expect(reloaded.useStorageStatus.getState().error).toBe(false)
  const record = reloaded.useDemoStore.getState().assets.find((a) => a.id === 'cash')!
  expect(record.workflow!.purchases[0].attachments[0].name).toBe('invoice.pdf')
  expect(record.workflow!.history.map((h) => h.action)).toEqual(['created', 'purchaseAdded'])
  expect(reloaded.useDemoStore.getState().assets.filter((a) => a.id !== 'cash')).toEqual([])
})
it('preserves malformed workflow storage and warns without overwriting it', async () => {
  const old = seedData()
  const value = JSON.stringify({
    version: 2,
    state: { ...old, assets: [{ ...old.assets[0], workflow: { phase: 'closed' } }] }
  })
  localStorage.setItem('ithraa-hr-demo-v1', value)
  const { useDemoStore, useStorageStatus } = await import('../../core/hooks/useDemoStore')
  expect(useStorageStatus.getState().error).toBe(true)
  useDemoStore.getState().saveEmployee({ ...old.employees[0], fullName: 'Edited in session' })
  expect(localStorage.getItem('ithraa-hr-demo-v1')).toBe(value)
})

it('reloads older physical returns without a catalog item and preserves all saved records', async () => {
  const old = seedData()
  const { emptyWorkflow } = await import('../utils/workflow')
  const returned = {
    ...old.assets[0],
    status: 'Returned' as const,
    workflow: {
      ...emptyWorkflow(null),
      phase: 'closed' as const,
      history: [
        {
          id: 'return',
          action: 'employeeReturned',
          actor: old.assets[0].employeeId,
          at: new Date().toISOString(),
          note: ''
        }
      ]
    }
  }
  const saved = { ...old, assets: [returned, ...old.assets.slice(1)] }
  localStorage.setItem('ithraa-hr-demo-v1', JSON.stringify({ version: 3, state: saved }))
  const { useDemoStore, useStorageStatus } = await import('../../core/hooks/useDemoStore')
  expect(useStorageStatus.getState().error).toBe(false)
  expect(useDemoStore.getState().assets).toEqual(saved.assets)
  const run = useDemoStore.getState().custodyAction
  run({ type: 'close', id: old.assets[1].id, note: 'Received by manager' }, { role: 'manager' })
  vi.resetModules()
  const reloaded = await import('../../core/hooks/useDemoStore')
  expect(reloaded.useStorageStatus.getState().error).toBe(false)
  expect(reloaded.useDemoStore.getState().assets[1].workflow!.history[0].action).toBe(
    'managerReceived'
  )
  expect(reloaded.useDemoStore.getState().assets[0]).toEqual(returned)
})

it.each([1, 2])(
  'clears only custody when upgrading storage version %s and never repeats cleanup',
  async (version) => {
    const old = seedData()
    old.employees[0].fullName = 'Preserved employee'
    old.inventory = [
      {
        id: 'stock',
        type: 'Laptop',
        name: 'Kept laptop',
        serial: 'KEPT-1',
        condition: 'Good',
        accessories: 'Charger',
        retired: false
      }
    ]
    old.clearances = [{ employeeId: 'employee-8', issuedAt: '2026-10-20' }]
    localStorage.setItem('ithraa-hr-demo-v1', JSON.stringify({ version, state: old }))
    const { useDemoStore } = await import('../../core/hooks/useDemoStore')
    expect(useDemoStore.getState().assets).toEqual([])
    expect(useDemoStore.getState().employees).toEqual(old.employees)
    expect(useDemoStore.getState().inventory).toEqual(old.inventory)
    expect(useDemoStore.getState().clearances).toEqual(old.clearances)
    expect(JSON.parse(localStorage.getItem('ithraa-hr-demo-v1')!).version).toBe(3)
    useDemoStore.getState().custodyAction(
      {
        type: 'create',
        id: 'new',
        kind: 'financial',
        employeeId: 'employee-1',
        description: 'New custody',
        amount: 100,
        dueDate: '2099-12-31'
      },
      { role: 'manager' }
    )
    vi.resetModules()
    const reloaded = await import('../../core/hooks/useDemoStore')
    expect(reloaded.useDemoStore.getState().assets.map((a) => a.id)).toEqual(['new'])
  }
)
