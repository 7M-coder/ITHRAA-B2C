import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { packageSchema } from '../validations/schemas'
import { plainDescription, descriptionDocumentSchema } from '../utils/description'
import { newPackage } from '../utils/editor'
import { newStay } from '../utils/finance'
import { usePackageStore, PACKAGE_STORAGE_KEY } from '../hooks/usePackageStore'

describe('formatted package descriptions', () => {
  it('accepts actual editor output for headings, formatted text and numbered lists', () => {
    const editor = new Editor({
      extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] })],
      content: '<h2>العنوان</h2><ol><li><p><strong>Item</strong></p></li></ol>'
    })
    expect(descriptionDocumentSchema.safeParse(editor.getJSON()).success).toBe(true)
    editor.destroy()
  })
  it('saves and rehydrates bilingual paragraphs and formatting without losing the plain description', async () => {
    const item = {
      ...newPackage(),
      name: 'Formatted description',
      description: 'وصف الباقة\nEnglish description',
      descriptionDocument: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2, textAlign: 'right' },
            content: [{ type: 'text', text: 'وصف الباقة', marks: [{ type: 'bold' }] }]
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [{ type: 'text', text: 'English description' }]
          }
        ]
      }
    }
    usePackageStore.getState().savePackage(item)
    const stored = localStorage.getItem(PACKAGE_STORAGE_KEY)
    expect(stored).toContain('descriptionDocument')
    await usePackageStore.persist.rehydrate()
    expect(usePackageStore.getState().packages.find((p) => p.id === item.id)).toMatchObject(item)
  })
  it('supports complete long multiline descriptions and rejects executable markup and unknown formatting', () => {
    const item = {
      ...newPackage(),
      name: 'Long description',
      description: 'وصف الباقة\nEnglish paragraph\n'.repeat(150)
    }
    expect(packageSchema.safeParse(item).success).toBe(true)
    expect(packageSchema.safeParse({ ...item, description: 'x'.repeat(20001) }).success).toBe(false)
    expect(
      descriptionDocumentSchema.safeParse({
        type: 'doc',
        content: [{ type: 'script', text: 'alert(1)' }]
      }).success
    ).toBe(false)
    expect(
      descriptionDocumentSchema.safeParse({
        type: 'doc',
        content: [
          {
            type: 'text',
            text: 'link',
            marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
          }
        ]
      }).success
    ).toBe(false)
    expect(plainDescription('<script>text</script>').content?.[0].content?.[0].text).toBe(
      '<script>text</script>'
    )
  })
  it('offers only double, triple and quadruple rooms for new housing', () => {
    expect(newStay().rooms.map((r) => r.occupancy)).toEqual([2, 3, 4])
  })
  it.each([
    'luxury',
    'luxury_transitional',
    'premium',
    'premium_transitional',
    'basic',
    'basic_transitional'
  ])('saves category %s', (category) => {
    const item = newPackage()
    expect(
      packageSchema.safeParse({ ...item, name: 'Category', editor: { ...item.editor, category } })
        .success
    ).toBe(true)
  })
})
