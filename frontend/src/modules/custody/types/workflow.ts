export type CustodyPhase =
  'draft' | 'awaitingReceipt' | 'active' | 'review' | 'issue' | 'closed' | 'cancelled'
export interface CustodyActor {
  role: 'manager' | 'employee'
  employeeId?: string
}
export interface InvoiceAttachment {
  id: string
  name: string
  type: 'application/pdf' | 'image/png' | 'image/jpeg'
  data: string
}
export interface PurchaseLine {
  description: string
  quantity: number
  unitPrice: number
}
export interface Purchase {
  id: string
  supplier: string
  date: string
  invoiceNumber: string
  items: PurchaseLine[]
  attachments: InvoiceAttachment[]
  missingInvoiceReason: string
  status: 'draft' | 'submitted' | 'approved' | 'changes' | 'rejected'
  reviewNote: string
}
export interface Settlement {
  id: string
  kind: 'return' | 'reimburse'
  amount: number
  reference: string
  at: string
}
export interface CustodyEvent {
  id: string
  action: string
  at: string
  actor: string
  note: string
}
export interface CustodyWorkflow {
  conditionAtIssue?: string
  accessoriesAtIssue?: string
  phase: CustodyPhase
  amount: number | null
  dueDate: string
  inventoryId?: string
  issueReference: string
  purchases: Purchase[]
  settlements: Settlement[]
  history: CustodyEvent[]
  returnNote: string
}
export interface InventoryItem {
  id: string
  type: 'Laptop' | 'Car' | 'Equipment'
  name: string
  serial: string
  condition: string
  accessories: string
  retired: boolean
}
export type CustodyDialogAction =
  | 'issue'
  | 'setAmount'
  | 'requestClose'
  | 'changes'
  | 'reject'
  | 'returnForChanges'
  | 'settle'
  | 'close'
  | 'inspect'
  | 'resolveIssue'
  | 'cancel'
export type CustodyCommand =
  | { type: 'inventory'; item: InventoryItem }
  | {
      type: 'create'
      id: string
      employeeId: string
      kind: 'financial' | 'physical'
      description: string
      dueDate: string
      amount: number | null
      inventoryId?: string
    }
  | { type: 'setAmount'; id: string; amount: number }
  | { type: 'issue'; id: string; reference: string }
  | { type: 'receive'; id: string }
  | { type: 'purchase'; id: string; purchase: Purchase }
  | { type: 'deletePurchase'; id: string; purchaseId: string }
  | { type: 'requestClose'; id: string; note: string }
  | {
      type: 'reviewPurchase'
      id: string
      purchaseId: string
      decision: 'approved' | 'changes' | 'rejected'
      note: string
    }
  | { type: 'returnForChanges'; id: string; note: string }
  | { type: 'settle'; id: string; kind: 'return' | 'reimburse'; amount: number; reference: string }
  | { type: 'close'; id: string; note: string; returnedAmount?: number }
  | { type: 'inspect'; id: string; result: 'good' | 'issue'; note: string }
  | { type: 'resolveIssue'; id: string; result: 'returned' | 'writtenOff'; note: string }
  | { type: 'cancel'; id: string; note: string }
