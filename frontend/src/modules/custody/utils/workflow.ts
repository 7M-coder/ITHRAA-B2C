import type { Asset, DemoData } from '../../core/types/domain'
import type {
  CustodyActor,
  CustodyCommand,
  CustodyWorkflow,
  InventoryItem,
  Purchase
} from '../types/workflow'
import {
  custodyRequired,
  custodyText,
  custodyDate,
  custodyMoney,
  inventorySchema,
  purchaseSchema,
  workflowSchema
} from '../validations/schemas'
import { isoDate } from '../../core/utils/domain'
/** Maps both older and current custody records to the two displayed states without changing stored history. @param asset - Stored custody status. @returns Open or closed, consistent with clearance and inventory availability. */
export function getCustodyStatus(asset: Pick<Asset, 'status'>): 'open' | 'closed' {
  return asset.status === 'Returned' ? 'closed' : 'open'
}
/** Totals an invoice in integer halalas. @param purchase - Invoice line items. @returns Amount in halalas. */
export function purchaseCents(purchase: Pick<Purchase, 'items'>): number {
  return purchase.items.reduce(
    (sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity,
    0
  )
}
/** Totals recorded spending and returns while preserving historical settlements. @param asset - Financial custody. @returns Amounts in riyals and signed outstanding balance. */
export function custodyBalance(asset: Asset) {
  const w = asset.workflow
  const approved = (w?.purchases ?? [])
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + purchaseCents(p), 0)
  const entered = (w?.purchases ?? [])
    .filter((p) => p.status !== 'rejected')
    .reduce((sum, p) => sum + purchaseCents(p), 0)
  const returned = (w?.settlements ?? [])
    .filter((s) => s.kind === 'return')
    .reduce((sum, s) => sum + Math.round(s.amount * 100), 0)
  const reimbursed = (w?.settlements ?? [])
    .filter((s) => s.kind === 'reimburse')
    .reduce((sum, s) => sum + Math.round(s.amount * 100), 0)
  return {
    approved: approved / 100,
    entered: entered / 100,
    returned: returned / 100,
    reimbursed: reimbursed / 100,
    balance: (Math.round((w?.amount ?? 0) * 100) - entered - returned + reimbursed) / 100
  }
}
/** Tests whether an inventory unit is already reserved by an unsettled custody. @param assets - Custodies. @param item - Inventory unit. @returns Availability. */
export function inventoryAvailable(assets: Asset[], item: InventoryItem): boolean {
  return (
    !item.retired &&
    !assets.some(
      (a) =>
        a.status !== 'Returned' &&
        (a.workflow?.inventoryId === item.id ||
          (a.type !== 'Advance' && a.serialNumber.toLowerCase() === item.serial.toLowerCase()))
    )
  )
}
/** Builds clean workflow fields without altering historical core records. @param amount - Cash advance or null. @param dueDate - Expected settlement date. @returns Workflow. */
export function emptyWorkflow(amount: number | null, dueDate = ''): CustodyWorkflow {
  return {
    phase: 'active',
    amount,
    dueDate,
    issueReference: '',
    purchases: [],
    settlements: [],
    history: [],
    returnNote: ''
  }
}
/** Reads physical records directly, including older entries without tracking fields. @param asset - Stored custody. @returns Existing or derived tracking data; cash with unknown amount stays undefined. */
export function getCustodyWorkflow(asset: Asset): CustodyWorkflow | undefined {
  if (asset.workflow) return asset.workflow
  if (asset.type === 'Advance') return undefined
  return {
    ...emptyWorkflow(null),
    phase: asset.status === 'Returned' ? 'closed' : asset.status === 'Lost' ? 'issue' : 'active'
  }
}
/** Applies role, ownership, lifecycle and money invariants atomically. @param state - Shared business state. @param command - Requested action. @param actor - Demo role and employee identity. @returns Updated custody and inventory arrays. */
export function applyCustodyCommand(
  state: DemoData,
  command: CustodyCommand,
  actor: CustodyActor
): Pick<DemoData, 'assets' | 'inventory'> {
  const assets = structuredClone(state.assets)
  const inventory = structuredClone(state.inventory ?? [])
  const requireManager = () => {
    if (actor.role !== 'manager') throw new Error('permission')
  }
  const event = (asset: Asset, action: string, note = '') =>
    asset.workflow!.history.push({
      id: crypto.randomUUID(),
      action,
      at: new Date().toISOString(),
      actor: actor.role === 'manager' ? 'manager' : actor.employeeId!,
      note
    })
  const editableEmployee = (asset: Asset) => {
    if (actor.role !== 'employee' || actor.employeeId !== asset.employeeId)
      throw new Error('permission')
  }
  if (command.type === 'inventory') {
    requireManager()
    const item = inventorySchema.parse(command.item)
    if (
      inventory.some(
        (i) => i.id === item.id || i.serial.toLowerCase() === item.serial.toLowerCase()
      ) ||
      assets.some(
        (a) => a.type !== 'Advance' && a.serialNumber.toLowerCase() === item.serial.toLowerCase()
      )
    )
      throw new Error('duplicateSerial')
    return { assets, inventory: [...inventory, item] }
  }
  if (command.type === 'create') {
    requireManager()
    const employee = state.employees.find((e) => e.id === command.employeeId)
    if (
      !employee ||
      employee.employmentStatus === 'Terminated' ||
      state.clearances.some((c) => c.employeeId === employee.id) ||
      assets.some((a) => a.id === command.id)
    )
      throw new Error('invalidEmployee')
    const description = custodyRequired.parse(command.description)
    const dueDate = custodyDate.parse(command.dueDate)
    if (dueDate < isoDate()) throw new Error('dateRange')
    const item =
      command.kind === 'physical' ? inventory.find((i) => i.id === command.inventoryId) : undefined
    if (command.kind === 'physical' && (!item || !inventoryAvailable(assets, item)))
      throw new Error('inventoryUnavailable')
    const workflow = emptyWorkflow(
      command.kind === 'financial' ? custodyMoney.parse(command.amount) : null,
      dueDate
    )
    if (item) {
      workflow.inventoryId = item.id
      workflow.conditionAtIssue = item.condition
      workflow.accessoriesAtIssue = item.accessories
    }
    const asset: Asset = {
      id: command.id,
      employeeId: command.employeeId,
      type: item?.type ?? 'Advance',
      description,
      serialNumber: item?.serial ?? '',
      assignedAt: isoDate(),
      status: 'Active',
      workflow
    }
    event(asset, 'created')
    return { assets: [...assets, asset], inventory }
  }
  const asset = assets.find((a) => a.id === command.id)
  if (!asset) throw new Error('missing')
  if (command.type === 'setAmount') {
    requireManager()
    if (asset.workflow || asset.type !== 'Advance' || asset.status === 'Returned')
      throw new Error('phase')
    asset.workflow = emptyWorkflow(custodyMoney.parse(command.amount))
    event(asset, 'amountRecorded')
    return { assets, inventory }
  }
  if (!asset.workflow && asset.type !== 'Advance' && command.type === 'close') {
    requireManager()
    if (asset.status === 'Returned') throw new Error('phase')
    asset.workflow = getCustodyWorkflow(asset)
  }
  const w = asset.workflow
  if (!w || ['closed', 'cancelled'].includes(w.phase)) throw new Error('phase')
  const financial = asset.type === 'Advance'
  const ensurePhase = (...phases: CustodyWorkflow['phase'][]) => {
    if (!phases.includes(w.phase)) throw new Error('phase')
  }
  // Earlier approval phases remain readable but now behave as open tracking records.
  if (!['active', 'issue'].includes(w.phase)) w.phase = 'active'
  switch (command.type) {
    case 'purchase': {
      editableEmployee(asset)
      ensurePhase('active')
      if (!financial) throw new Error('phase')
      const purchase = purchaseSchema.parse(command.purchase)
      const old = w.purchases.find((p) => p.id === purchase.id)
      if (
        purchase.date < asset.assignedAt ||
        purchase.date > isoDate() ||
        purchaseCents(purchase) > 1e10
      )
        throw new Error('dateRange')
      if (
        purchase.invoiceNumber &&
        w.purchases.some(
          (p) =>
            p.id !== purchase.id &&
            p.invoiceNumber.toLowerCase() === purchase.invoiceNumber.toLowerCase() &&
            p.supplier.toLowerCase() === purchase.supplier.toLowerCase() &&
            p.date === purchase.date
        )
      )
        throw new Error('duplicateInvoice')
      purchase.status = 'draft'
      purchase.reviewNote = ''
      w.purchases = old
        ? w.purchases.map((p) => (p.id === purchase.id ? purchase : p))
        : [...w.purchases, purchase]
      event(asset, old ? 'purchaseEdited' : 'purchaseAdded', purchase.supplier)
      break
    }
    case 'deletePurchase':
      editableEmployee(asset)
      ensurePhase('active')
      if (!financial || !w.purchases.some((p) => p.id === command.purchaseId))
        throw new Error('missing')
      w.purchases = w.purchases.filter((p) => p.id !== command.purchaseId)
      event(asset, 'purchaseDeleted')
      break
    case 'close': {
      requireManager()
      ensurePhase('active', 'issue')
      const note = custodyText.parse(command.note)
      if (financial) {
        if (
          w.purchases.some(
            (p) =>
              p.status !== 'rejected' && !p.attachments.length && !p.missingInvoiceReason.trim()
          )
        )
          throw new Error('invoiceRequired')
        const returned = command.returnedAmount ?? 0
        if (returned !== 0) custodyMoney.parse(returned)
        const outstanding = Math.round(custodyBalance(asset).balance * 100)
        if (Math.round(returned * 100) !== Math.max(0, outstanding))
          throw new Error('settlementAmount')
        if (returned > 0) {
          w.settlements.push({
            id: crypto.randomUUID(),
            kind: 'return',
            amount: returned,
            reference: '',
            at: new Date().toISOString()
          })
          event(asset, 'cashReturned', note)
        }
      }
      w.returnNote = note
      event(asset, financial ? 'managerClosed' : 'managerReceived', note)
      w.phase = 'closed'
      asset.status = 'Returned'
      break
    }
    default:
      // Approval and handover commands have been removed from the tracking workflow.
      throw new Error('phase')
  }
  workflowSchema.parse(w)
  return { assets, inventory }
}
