"use client"
import { useEffect, useState, useRef } from "react"
import { Editor } from "@tinymce/tinymce-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000"

const PLACEHOLDERS = [
  { key: "{firstname}", description: "Vorname des Kunden" },
  { key: "{lastname}", description: "Nachname des Kunden" },
  { key: "{street}", description: "Straße" },
  { key: "{housenumber}", description: "Hausnummer" },
  { key: "{zip}", description: "Postleitzahl" },
  { key: "{city}", description: "Stadt" },
  { key: "{email}", description: "E-Mail" },
  { key: "{audio_title}", description: "Audio-Titel" },
  { key: "{license_model}", description: "Lizenzmodell-Name" },
  { key: "{license_description}", description: "Lizenzmodell-Beschreibung" },
  { key: "{order_id}", description: "Bestellnummer" },
  { key: "{purchase_date}", description: "Kaufdatum" },
  { key: "{license_number}", description: "Lizenz-Nummer" },
  { key: "{{LOGO}}", description: "Logo-Position (nicht entfernen!)" }
]

export default function LicenseTemplatePage() {
  const [template, setTemplate] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    loadTemplate()
  }, [])

  async function loadTemplate() {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/dbp-admin/api/license-template", {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setTemplate(data.template_html || data.templateHtml || "")
        if (data.logo_filename || data.logoFilename) {
          setCurrentLogo(`/custom/uploads/license-logos/${data.logo_filename || data.logoFilename}`)
        }
      }
    } catch (err) {
      console.error("Load error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate() {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
    if (!token) return

    setSaving(true)
    try {
      // Save template HTML
      const res = await fetch("/dbp-admin/api/license-template", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ template_html: template })
      })

      if (!res.ok) {
        alert("Fehler beim Speichern")
        return
      }

      // Upload logo if selected
      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)

        const logoRes = await fetch("/dbp-admin/api/license-template/logo", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })

        if (logoRes.ok) {
          const logoData = await logoRes.json()
          setCurrentLogo(logoData.url)
          setLogoFile(null)
        }
      }

      alert("Template gespeichert!")
    } catch (err) {
      console.error("Save error:", err)
      alert("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  async function deleteLogo() {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
    if (!token || !confirm("Logo wirklich löschen?")) return

    try {
      const res = await fetch("/dbp-admin/api/license-template/logo", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setCurrentLogo(null)
        alert("Logo gelöscht")
      }
    } catch (err) {
      console.error("Delete logo error:", err)
    }
  }

  function insertPlaceholder(placeholder: string) {
    if (editorRef.current) {
      editorRef.current.insertContent(placeholder)
    }
  }

  function previewTemplate() {
    // Beispieldaten für Preview
    const sampleData: Record<string, string> = {
      firstname: "Max",
      lastname: "Mustermann",
      street: "Musterstraße",
      housenumber: "123",
      zip: "12345",
      city: "Musterstadt",
      email: "max.mustermann@example.com",
      audio_title: "Beispiel Audio Track",
      license_model: "Standard Lizenz",
      license_description: "Diese Lizenz erlaubt die kommerzielle Nutzung des Audio-Materials.",
      order_id: "08012026_001",
      purchase_date: new Date().toLocaleDateString("de-DE")
    }

    // Template mit Beispieldaten füllen
    let previewHtml = template

    // Logo ersetzen
    if (currentLogo) {
      previewHtml = previewHtml.replace("{{LOGO}}", `<img class="logo" src="${currentLogo}" alt="Logo" />`)
    } else {
      previewHtml = previewHtml.replace("{{LOGO}}", "")
    }

    // Platzhalter ersetzen
    for (const [key, value] of Object.entries(sampleData)) {
      const regex = new RegExp(`\\{${key}\\}`, "g")
      previewHtml = previewHtml.replace(regex, value)
    }

    // Neues Fenster mit Preview öffnen
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(previewHtml)
      previewWindow.document.close()
    }
  }

  if (loading) return <div style={{ padding: "20px" }}>Lädt...</div>

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Audio-Lizenz Template</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>
        {/* Editor */}
        <div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
              HTML Template
            </label>
            <Editor
              apiKey="40heb53c74y203of8w20qin4j4t73xou254hjisam7z6w3r4"
              onInit={(evt, editor) => editorRef.current = editor}
              value={template}
              onEditorChange={(content) => setTemplate(content)}
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

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
              Logo hochladen
            </label>
            {currentLogo && (
              <div style={{ marginBottom: "10px" }}>
                <img src={currentLogo} alt="Logo" style={{ maxWidth: "200px", border: "1px solid #ccc" }} />
                <button onClick={deleteLogo} style={{ marginLeft: "10px", padding: "5px 10px" }}>
                  Logo löschen
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            onClick={saveTemplate}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              marginRight: "10px"
            }}
          >
            {saving ? "Speichert..." : "Template speichern"}
          </button>

          <button
            onClick={previewTemplate}
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Vorschau anzeigen
          </button>
        </div>

        {/* Placeholders */}
        <div>
          <h3>Verfügbare Platzhalter</h3>
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            {PLACEHOLDERS.map((p) => (
              <div key={p.key} style={{ marginBottom: "10px", padding: "8px", background: "#f5f5f5", borderRadius: "4px" }}>
                <code
                  style={{ 
                    background: "#333", 
                    color: "#fff", 
                    padding: "2px 6px", 
                    borderRadius: "3px", 
                    cursor: "pointer" 
                  }}
                  onClick={() => insertPlaceholder(p.key)}
                  title="Klicken zum Einfügen"
                >
                  {p.key}
                </code>
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#666" }}>
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
