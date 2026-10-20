import type { JSONContent } from '@tiptap/react'
import { z } from 'zod'
import { isSafeInput } from '@/modules/core/utils/inputSafety'

/** Validates a bounded document containing only supported formatting and safe text. @param value - Stored document. @returns Whether the document is supported. */
export function isDescriptionDocument(value: unknown): value is JSONContent {
  let count = 0
  const visit = (node: unknown, depth: number): boolean => {
    if (!node || typeof node !== 'object' || depth > 15 || ++count > 10000) return false
    const n = node as JSONContent
    if (
      ![
        'doc',
        'paragraph',
        'heading',
        'text',
        'bulletList',
        'orderedList',
        'listItem',
        'hardBreak'
      ].includes(n.type ?? '')
    )
      return false
    if (n.text !== undefined && (typeof n.text !== 'string' || !isSafeInput(n.text))) return false
    if (
      n.attrs &&
      Object.entries(n.attrs).some(([key, v]) =>
        key === 'level'
          ? ![2, 3].includes(v)
          : key === 'textAlign'
            ? ![null, 'left', 'right', 'center', 'justify'].includes(v)
            : key === 'start'
              ? !Number.isInteger(v) || v < 1
              : key === 'type'
                ? ![null, '1', 'a', 'A', 'i', 'I'].includes(v)
                : key === 'dir'
                  ? ![null, 'auto', 'ltr', 'rtl'].includes(v)
                  : true
      )
    )
      return false
    if (
      n.marks &&
      (!Array.isArray(n.marks) ||
        n.marks.some(
          (m) =>
            !m ||
            !['bold', 'italic', 'underline'].includes(m.type) ||
            (m.attrs && Object.keys(m.attrs).length > 0)
        ))
    )
      return false
    return (
      n.content === undefined ||
      (Array.isArray(n.content) && n.content.every((child) => visit(child, depth + 1)))
    )
  }
  return (
    visit(value, 0) &&
    (value as JSONContent).type === 'doc' &&
    JSON.stringify(value).length <= 100000
  )
}

export const descriptionDocumentSchema = z.custom<JSONContent>(isDescriptionDocument, 'unsafe')
export const descriptionTextSchema = z
  .string()
  .max(20000)
  .refine((value) => value.split(/\r?\n/).every(isSafeInput), 'unsafe')

/** Converts existing plain descriptions to safe paragraphs without interpreting HTML. @param text - Saved plain text. @returns Editor document. */
export function plainDescription(text: string): JSONContent {
  return {
    type: 'doc',
    content: text
      .split(/\r?\n/)
      .map((line) => ({ type: 'paragraph', content: line ? [{ type: 'text', text: line }] : [] }))
  }
}
