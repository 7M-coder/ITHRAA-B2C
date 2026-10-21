import { getCustodyStatus, emptyWorkflow } from '../utils/workflow'
import { expect, it } from 'vitest'
import type { DemoData } from '../../core/types/domain'
import type { CustodyActor, CustodyCommand, Purchase } from '../types/workflow'
import { seedData } from '../../core/utils/seed'
import { canClear, isoDate } from '../../core/utils/domain'
import { applyCustodyCommand, custodyBalance, inventoryAvailable } from '../utils/workflow'
import { attachmentSchema } from '../validations/schemas'
import { readInvoice } from '../utils/invoices'

const manager: CustodyActor = { role: 'manager' }
const employee: CustodyActor = { role: 'employee', employeeId: 'employee-1' }
/** Creates an isolated workflow harness. @returns Atomic state and actions. */
function harness() {
  let state: DemoData = { ...seedData(), assets: [], inventory: [], clearances: [] }
  return {
    get: () => state,
    run: (command: CustodyCommand, actor = manager) => {
      state = { ...state, ...applyCustodyCommand(state, command, actor) }
    }
  }
}
/** Creates and hands over a cash advance. @param amount - Advance value. @returns Active cash workflow. */
function cash(amount = 5000) {
  const h = harness()
  h.run({
    type: 'create',
    id: 'cash',
    kind: 'financial',
    employeeId: 'employee-1',
    description: 'Office purchases',
    amount,
    dueDate: '2099-12-31'
  })
  return h
}
/** Builds an invoice with an explicit missing-receipt explanation. @param amount - Invoice total. @param id - Invoice identifier. @returns Purchase draft. */
function purchase(amount: number, id = 'invoice'): Purchase {
  return {
    id,
    supplier: 'Supplier',
    date: isoDate(),
    invoiceNumber: id,
    items: [{ description: 'Supplies', quantity: 1, unitPrice: amount }],
    attachments: [],
    missingInvoiceReason: 'Original unavailable; manager to review',
    status: 'draft',
    reviewNote: ''
  }
}

it('opens immediately, enforces ownership and restricts closure to the manager without an approval cycle', () => {
  const h = cash()
  expect(h.get().assets[0].workflow!.phase).toBe('active')
  expect(() => h.run({ type: 'purchase', id: 'cash', purchase: purchase(100) })).toThrow(
    'permission'
  )
  expect(() =>
    h.run(
      { type: 'close', id: 'cash', note: '', returnedAmount: 5000 },
      { role: 'employee', employeeId: 'employee-2' }
    )
  ).toThrow('permission')
  expect(() =>
    h.run({ type: 'close', id: 'cash', note: '', returnedAmount: 5000 }, employee)
  ).toThrow('permission')
  h.run({ type: 'purchase', id: 'cash', purchase: purchase(4200) }, employee)
  expect(custodyBalance(h.get().assets[0]).balance).toBe(800)
  expect(() =>
    h.run({ type: 'close', id: 'cash', note: '', returnedAmount: 799 }, manager)
  ).toThrow('settlementAmount')
  h.run({ type: 'close', id: 'cash', note: 'Returned', returnedAmount: 800 }, manager)
  expect(h.get().assets[0].status).toBe('Returned')
  expect(custodyBalance(h.get().assets[0]).balance).toBe(0)
  expect(() => h.run({ type: 'purchase', id: 'cash', purchase: purchase(1) }, employee)).toThrow(
    'phase'
  )
})
it('counts spending immediately and permits edits and deletion before closure', () => {
  const h = cash(100)
  h.run({ type: 'purchase', id: 'cash', purchase: purchase(50) }, employee)
  h.run({ type: 'purchase', id: 'cash', purchase: purchase(70) }, employee)
  expect(custodyBalance(h.get().assets[0]).balance).toBe(30)
  h.run({ type: 'deletePurchase', id: 'cash', purchaseId: 'invoice' }, employee)
  expect(custodyBalance(h.get().assets[0]).balance).toBe(100)
})
it('keeps excess spending visible without manufacturing a reimbursement', () => {
  const h = cash(100)
  h.run({ type: 'purchase', id: 'cash', purchase: purchase(120) }, employee)
  h.run({ type: 'close', id: 'cash', note: 'Extra spend', returnedAmount: 0 }, manager)
  expect(custodyBalance(h.get().assets[0]).balance).toBe(-20)
  expect(h.get().assets[0].workflow!.settlements).toEqual([])
})
it('requires invoice evidence or explanation only at closure', () => {
  const h = cash(100)
  h.run(
    { type: 'purchase', id: 'cash', purchase: { ...purchase(100), missingInvoiceReason: '' } },
    employee
  )
  expect(() => h.run({ type: 'close', id: 'cash', note: '', returnedAmount: 0 }, manager)).toThrow(
    'invoiceRequired'
  )
  h.run({ type: 'purchase', id: 'cash', purchase: purchase(100) }, employee)
  h.run({ type: 'close', id: 'cash', note: '', returnedAmount: 0 }, manager)
  expect(h.get().assets[0].workflow!.phase).toBe('closed')
})
it('preserves older review records and closes them directly', () => {
  const h = cash(100)
  h.run({ type: 'purchase', id: 'cash', purchase: purchase(80) }, employee)
  h.get().assets[0].workflow!.phase = 'review'
  h.get().assets[0].workflow!.purchases[0].status = 'submitted'
  const history = structuredClone(h.get().assets[0].workflow!.history)
  h.run({ type: 'close', id: 'cash', note: '', returnedAmount: 20 }, manager)
  expect(h.get().assets[0].workflow!.history.slice(0, history.length)).toEqual(history)
  expect(h.get().assets[0].workflow!.purchases[0].items[0].unitPrice).toBe(80)
})
it('releases physical stock and clearance on manager receipt without inspection', () => {
  const h = harness(),
    item = {
      id: 'unit',
      type: 'Laptop' as const,
      name: 'Laptop',
      serial: 'S1',
      condition: 'Good',
      accessories: 'Charger',
      retired: false
    }
  h.run({ type: 'inventory', item })
  const create: CustodyCommand = {
    type: 'create',
    id: 'laptop',
    kind: 'physical',
    inventoryId: 'unit',
    employeeId: 'employee-1',
    description: 'Work laptop',
    amount: null,
    dueDate: '2099-12-31'
  }
  h.run(create)
  expect(inventoryAvailable(h.get().assets, item)).toBe(false)
  expect(() => h.run({ ...create, id: 'duplicate' })).toThrow('inventoryUnavailable')
  const terminated = { ...h.get().employees[0], employmentStatus: 'Terminated' as const }
  expect(canClear(terminated, h.get().assets)).toBe(false)
  h.run({ type: 'close', id: 'laptop', note: 'Laptop and charger returned' }, manager)
  expect(inventoryAvailable(h.get().assets, item)).toBe(true)
  expect(canClear(terminated, h.get().assets)).toBe(true)
  expect(h.get().assets[0].workflow!.conditionAtIssue).toBe('Good')
})
it('rejects duplicate invoices and uses integer money precision', () => {
  const h = cash(0.3),
    invoice = {
      ...purchase(0.1),
      items: [
        { description: 'A', quantity: 1, unitPrice: 0.1 },
        { description: 'B', quantity: 1, unitPrice: 0.2 }
      ]
    }
  h.run({ type: 'purchase', id: 'cash', purchase: invoice }, employee)
  expect(() =>
    h.run({ type: 'purchase', id: 'cash', purchase: { ...invoice, id: 'duplicate' } }, employee)
  ).toThrow('duplicateInvoice')
  h.run({ type: 'close', id: 'cash', note: '', returnedAmount: 0 }, manager)
  expect(custodyBalance(h.get().assets[0]).balance).toBe(0)
})
it('rejects unsupported, oversized or forged invoice attachments', async () => {
  expect(
    attachmentSchema.safeParse({
      id: 'x',
      name: 'x.html',
      type: 'application/pdf',
      data: 'data:text/html;base64,PHNjcmlwdD4='
    }).success
  ).toBe(false)
  await expect(readInvoice(new File(['html'], 'x.html', { type: 'text/html' }))).rejects.toThrow(
    'attachmentInvalid'
  )
  await expect(
    readInvoice(new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))
  ).rejects.toThrow('attachmentInvalid')
})

it('records receipt of older physical custody directly without initialization or replacing its identity', () => {
  const original = seedData()
  const old = original.assets.find((a) => a.id === 'asset-1')!
  const result = applyCustodyCommand(original, { type: 'close', id: old.id, note: '' }, manager)
  const returned = result.assets.find((a) => a.id === old.id)!
  expect(returned).toMatchObject({ ...old, status: 'Returned', workflow: { phase: 'closed' } })
  expect(returned.workflow!.history.map((h) => h.action)).toEqual(['managerReceived'])
  expect(original.assets.find((a) => a.id === old.id)!.workflow).toBeUndefined()
  expect(result.inventory).toEqual(original.inventory)
  expect(() =>
    applyCustodyCommand(
      { ...original, ...result },
      { type: 'close', id: old.id, note: '' },
      employee
    )
  ).toThrow('phase')
  expect(() =>
    applyCustodyCommand(original, { type: 'close', id: old.id, note: '' }, employee)
  ).toThrow('permission')
})
it('requires a real amount for earlier cash records without a setup note', () => {
  const original = seedData()
  const old = original.assets.find((a) => a.type === 'Advance')!
  expect(() =>
    applyCustodyCommand(original, { type: 'setAmount', id: old.id, amount: 0 }, manager)
  ).toThrow()
  const result = applyCustodyCommand(
    original,
    { type: 'setAmount', id: old.id, amount: 1200 },
    manager
  )
  expect(result.assets.find((a) => a.id === old.id)!.workflow).toMatchObject({
    amount: 1200,
    phase: 'active'
  })
})

it('groups historical and current records consistently without changing stored data', () => {
  const records = seedData().assets
  const saved = structuredClone(records)
  for (const record of records)
    expect(getCustodyStatus(record)).toBe(record.status === 'Returned' ? 'closed' : 'open')
  for (const phase of [
    'draft',
    'awaitingReceipt',
    'active',
    'review',
    'issue',
    'closed',
    'cancelled'
  ] as const) {
    const closed = phase === 'closed' || phase === 'cancelled'
    const asset = {
      ...records[0],
      status: closed ? ('Returned' as const) : ('Active' as const),
      workflow: { ...emptyWorkflow(null), phase }
    }
    expect(getCustodyStatus(asset)).toBe(closed ? 'closed' : 'open')
  }
  expect(records).toEqual(saved)
})
