import { useEffect } from 'react'
import { Button, Form, Tooltip } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  FontSizeOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignRightOutlined,
  AlignCenterOutlined,
  AlignLeftOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { useTranslation } from 'react-i18next'
import type { HajjPackage } from '../types/domain'
import { plainDescription } from '../utils/description'
import './packageDescription.css'

interface Props {
  item: HajjPackage
  onChange?: (item: HajjPackage) => void
}
/** Edits or displays structured descriptions with an accessible formatting toolbar. @param props - Package and optional change callback. @returns Rich description. */
export function PackageDescriptionEditor({ item, onChange }: Props) {
  const { t } = useTranslation('packages')
  const editor = useEditor({
    immediatelyRender: false,
    textDirection: 'auto',
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        trailingNode: false
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: item.descriptionDocument ?? plainDescription(item.description),
    editable: !!onChange,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': t('fields.description'),
        'aria-multiline': 'true',
        dir: 'auto'
      }
    },
    onUpdate: ({ editor: current }) =>
      onChange?.({
        ...item,
        description: current.getText(),
        descriptionDocument: current.getJSON()
      }),
    shouldRerenderOnTransaction: true
  })
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const content = item.descriptionDocument ?? plainDescription(item.description)
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content))
      editor.commands.setContent(content, { emitUpdate: false })
  }, [editor, item.description, item.descriptionDocument])
  const commands = editor
    ? [
        {
          key: 'bold',
          icon: <BoldOutlined />,
          active: editor.isActive('bold'),
          run: () => editor.chain().focus().toggleBold().run()
        },
        {
          key: 'italic',
          icon: <ItalicOutlined />,
          active: editor.isActive('italic'),
          run: () => editor.chain().focus().toggleItalic().run()
        },
        {
          key: 'underline',
          icon: <UnderlineOutlined />,
          active: editor.isActive('underline'),
          run: () => editor.chain().focus().toggleUnderline().run()
        },
        {
          key: 'heading',
          icon: <FontSizeOutlined />,
          active: editor.isActive('heading'),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
        },
        {
          key: 'bulletList',
          icon: <UnorderedListOutlined />,
          active: editor.isActive('bulletList'),
          run: () => editor.chain().focus().toggleBulletList().run()
        },
        {
          key: 'orderedList',
          icon: <OrderedListOutlined />,
          active: editor.isActive('orderedList'),
          run: () => editor.chain().focus().toggleOrderedList().run()
        },
        ...(['right', 'center', 'left'] as const).map((key) => ({
          key,
          icon:
            key === 'right' ? (
              <AlignRightOutlined />
            ) : key === 'center' ? (
              <AlignCenterOutlined />
            ) : (
              <AlignLeftOutlined />
            ),
          active: editor.isActive({ textAlign: key }),
          run: () => editor.chain().focus().setTextAlign(key).run()
        })),
        {
          key: 'undo',
          icon: <UndoOutlined />,
          active: false,
          run: () => editor.chain().focus().undo().run()
        },
        {
          key: 'redo',
          icon: <RedoOutlined />,
          active: false,
          run: () => editor.chain().focus().redo().run()
        }
      ]
    : []
  const content = (
    <div className={`package-description ${onChange ? 'rounded-lg border border-line' : ''}`}>
      {onChange && (
        <div
          role="toolbar"
          aria-label={t('editor.richText.toolbar')}
          className="flex flex-wrap gap-1 border-b border-line p-2"
        >
          {commands.map((command) => (
            <Tooltip key={command.key} title={t(`editor.richText.${command.key}`)}>
              <Button
                className="h-8! w-8!"
                icon={command.icon}
                aria-label={t(`editor.richText.${command.key}`)}
                type={command.active ? 'primary' : 'default'}
                aria-pressed={command.active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={command.run}
              />
            </Tooltip>
          ))}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
  return onChange ? (
    <Form.Item label={t('fields.description')} extra={t('editor.richText.hint')}>
      {content}
    </Form.Item>
  ) : (
    content
  )
}
