import type { InvoiceAttachment } from '../types/workflow'
import { attachmentSchema } from '../validations/schemas'
/** Reads a bounded invoice attachment for local persistence. @param file - Employee-selected PDF or image. @returns Validated invoice. */
export async function readInvoice(file: File): Promise<InvoiceAttachment> {
  if (
    file.size > 1024 * 1024 ||
    !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)
  )
    throw new Error('attachmentInvalid')
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('attachmentInvalid'))
    reader.readAsDataURL(file)
  })
  return attachmentSchema.parse({ id: crypto.randomUUID(), name: file.name, type: file.type, data })
}
