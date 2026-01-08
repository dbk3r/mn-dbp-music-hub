"use client"
import { useState, useEffect, useRef } from "react"
import { Editor } from "@tinymce/tinymce-react"

export default function EmailTemplatePage() {
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    loadTemplate()
  }, [])

  async function loadTemplate() {
    setLoading(true)
    try {
      const token = localStorage.getItem("admin_auth_token")
      const res = await fetch("/dbp-backend/custom/admin/email-template", {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error("Failed to load template")

      const data = await res.json()
      setSubject(data.subject || "")
      setBodyHtml(data.bodyHtml || "")
    } catch (err) {
      setMessage({ type: "error", text: "Fehler beim Laden des Templates" })
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate() {
    setSaving(true)
    setMessage(null)
    try {
      const token = localStorage.getItem("admin_auth_token")
      const res = await fetch("/dbp-backend/custom/admin/email-template", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject, bodyHtml })
      })

      if (!res.ok) throw new Error("Failed to save template")

      setMessage({ type: "success", text: "Template erfolgreich gespeichert!" })
    } catch (err) {
      setMessage({ type: "error", text: "Fehler beim Speichern" })
    } finally {
      setSaving(false)
    }
  }

  function insertPlaceholder(placeholder: string) {
    if (editorRef.current) {
      editorRef.current.insertContent(`{${placeholder}}`)
    }
  }

  const placeholders = [
    { key: "firstname", desc: "Vorname" },
    { key: "lastname", desc: "Nachname" },
    { key: "email", desc: "E-Mail" },
    { key: "order_id", desc: "Bestellnummer" },
    { key: "license_number", desc: "Lizenz-Nummer" },
    { key: "purchase_date", desc: "Kaufdatum" },
    { key: "downloads", desc: "Download-Links (automatisch generiert)" }
  ]

  if (loading) {
    return <div className="page-container">Lädt Template...</div>
  }

  return (
    <div className="page-container" style={{ maxWidth: 1200 }}>
      <h1>E-Mail Template: Bestellbestätigung</h1>

      {message && (
        <div className={message.type === "success" ? "success-message" : "error-message"} style={{ padding: 15, marginBottom: 20, borderRadius: 4 }}>
          {message.text}
        </div>
      )}

      <div className="mb-20">
        <label>
          Betreff:
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: "100%" }}
          placeholder="z.B. Bestellbestätigung - Bestellung {order_id}"
        />
      </div>

      <div className="mb-20">
        <label>
          Verfügbare Platzhalter:
        </label>
        <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
          {placeholders.map(p => (
            <button
              key={p.key}
              onClick={() => insertPlaceholder(p.key)}
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: 13 }}
              title={p.desc}
            >
              {`{${p.key}}`}
            </button>
          ))}
        </div>
        <p className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
          Klicken Sie auf einen Platzhalter, um ihn am Ende des HTML-Texts einzufügen.
        </p>
      </div>

      <div className="mb-20">
        <label>
          HTML-Inhalt:
        </label>
        <Editor
          apiKey="40heb53c74y203of8w20qin4j4t73xou254hjisam7z6w3r4"
          onInit={(evt, editor) => editorRef.current = editor}
          value={bodyHtml}
          onEditorChange={(content) => setBodyHtml(content)}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor backcolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | code | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            skin: 'oxide-dark',
            content_css: 'dark'
          }}
        />
      </div>

      <div className="flex gap-12">
        <button
          onClick={saveTemplate}
          disabled={saving}
        >
          {saving ? "Speichert..." : "Template speichern"}
        </button>
      </div>

      <div className="section-container" style={{ marginTop: 40 }}>
        <h3>Hinweise:</h3>
        <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
          <li>Der Platzhalter <code>{`{downloads}`}</code> wird automatisch durch alle Download-Links ersetzt</li>
          <li>Die E-Mail wird automatisch versendet, wenn eine Bestellung den Status "paid" erreicht</li>
          <li>Verwenden Sie vollständiges HTML mit Styles für beste Darstellung</li>
          <li>Testen Sie das Template, indem Sie eine Testbestellung durchführen</li>
        </ul>
      </div>
    </div>
  )
}
