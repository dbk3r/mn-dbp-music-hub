"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect } from 'react'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  onReady?: (editor: any) => void
}

export default function TiptapEditor({ value, onChange, onReady }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  useEffect(() => {
    if (editor && onReady) {
      onReady(editor)
    }
  }, [editor, onReady])

  if (!editor) {
    return null
  }

  return (
    <div style={{ border: '1px solid var(--input-border)', borderRadius: 4, background: 'var(--input-bg)' }}>
      <div style={{ 
        borderBottom: '1px solid var(--input-border)', 
        padding: 8, 
        display: 'flex', 
        gap: 4, 
        flexWrap: 'wrap',
        background: '#1a1a1a'
      }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          style={{ 
            padding: '6px 12px', 
            background: editor.isActive('bold') ? 'var(--primary)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          style={{ 
            padding: '6px 12px', 
            background: editor.isActive('italic') ? 'var(--primary)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          style={{ 
            padding: '6px 12px', 
            background: editor.isActive('heading', { level: 1 }) ? 'var(--primary)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          style={{ 
            padding: '6px 12px', 
            background: editor.isActive('heading', { level: 2 }) ? 'var(--primary)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          style={{ 
            padding: '6px 12px', 
            background: editor.isActive('bulletList') ? 'var(--primary)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          • Liste
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          style={{ 
            padding: '6px 12px', 
            background: editor.isActive('orderedList') ? 'var(--primary)' : '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          1. Liste
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setColor('#ff0000').run()}
          style={{ 
            padding: '6px 12px', 
            background: '#333',
            border: 'none',
            borderRadius: 4,
            color: '#ff0000',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Rot
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setColor('#0000ff').run()}
          style={{ 
            padding: '6px 12px', 
            background: '#333',
            border: 'none',
            borderRadius: 4,
            color: '#0000ff',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Blau
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          style={{ 
            padding: '6px 12px', 
            background: '#333',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          Normal
        </button>
      </div>
      <EditorContent editor={editor} style={{ color: 'var(--foreground)' }} />
    </div>
  )
}
