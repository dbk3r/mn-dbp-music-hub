"use client"
import { Editor } from '@tinymce/tinymce-react'
import { useRef } from 'react'

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  onReady?: (editor: any) => void
}

// Simple TinyMCE wrapper to replace the old Tiptap editor
export default function TiptapEditor({ value, onChange, onReady }: TiptapEditorProps) {
  const editorRef = useRef<any>(null)

  return (
    <div>
      <Editor
        onInit={(evt, editor) => {
          editorRef.current = editor
          onReady?.(editor)
        }}
        initialValue={value}
        init={{
          height: 500,
          menubar: false,
          plugins: ['lists', 'link', 'paste', 'autoresize', 'table', 'code'],
          toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | removeformat | code',
          content_style: 'body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; font-size:14px }',
        }}
        onEditorChange={(content) => onChange(content)}
      />
    </div>
  )
}
