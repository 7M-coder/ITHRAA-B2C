import { z } from 'zod'
import { isSafeInput } from '../../core/utils/inputSafety'
export const custodyText = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value.split(/\r?\n/).every(isSafeInput), 'unsafe')
export const custodyRequired = custodyText.refine((v) => v.length > 0, 'required')
export const custodyDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
    'invalid'
  )
export const custodyMoney = z
  .number()
  .finite()
  .positive()
  .max(1e8)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001, 'moneyPrecision')
export const attachmentSchema = z
  .object({
    id: z.string().min(1),
    name: custodyRequired,
    type: z.enum(['application/pdf', 'image/png', 'image/jpeg']),
    data: z.string().max(1400000)
  })
  .superRefine((v, ctx) => {
    const prefix = { 'application/pdf': 'JVBER', 'image/png': 'iVBOR', 'image/jpeg': '/9j/' }[
      v.type
    ]
    if (
      !v.data.startsWith(`data:${v.type};base64,${prefix}`) ||
      !/^data:(application\/pdf|image\/(png|jpeg));base64,[A-Za-z0-9+/=]+$/.test(v.data)
    )
      ctx.addIssue({ code: 'custom', message: 'attachmentInvalid' })
  })
export const purchaseLineSchema = z.object({
  description: custodyRequired,
  quantity: z.number().int().min(1).max(100000),
  unitPrice: custodyMoney
})
export const purchaseSchema = z.object({
  id: z.string().min(1),
  supplier: custodyRequired,
  date: custodyDate,
  invoiceNumber: custodyText,
  items: z.array(purchaseLineSchema).min(1).max(100),
  attachments: z.array(attachmentSchema).max(2),
  missingInvoiceReason: custodyText,
  status: z.enum(['draft', 'submitted', 'approved', 'changes', 'rejected']),
  reviewNote: custodyText
})
export const inventorySchema = z.object({
  id: z.string().min(1),
  type: z.enum(['Laptop', 'Car', 'Equipment']),
  name: custodyRequired,
  serial: custodyRequired,
  condition: custodyText.default(''),
  accessories: custodyText,
  retired: z.boolean()
})
export const workflowSchema = z.object({
  conditionAtIssue: custodyText.optional(),
  accessoriesAtIssue: custodyText.optional(),
  phase: z.enum(['draft', 'awaitingReceipt', 'active', 'review', 'issue', 'closed', 'cancelled']),
  amount: custodyMoney.nullable(),
  dueDate: z.union([custodyDate, z.literal('')]),
  inventoryId: z.string().optional(),
  issueReference: custodyText,
  purchases: z.array(purchaseSchema),
  settlements: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum(['return', 'reimburse']),
      amount: custodyMoney,
      reference: custodyText,
      at: z.string()
    })
  ),
  history: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      at: z.string(),
      actor: z.string(),
      note: custodyText
    })
  ),
  returnNote: custodyText
})
