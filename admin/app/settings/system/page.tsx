"use client"
import { useState, useEffect } from "react"

type SystemSettings = {
  stripe_publishable_key: string
  stripe_secret_key: string
  stripe_webhook_secret: string
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    stripe_publishable_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const r = await fetch("/dbp-admin/api/settings", { headers })
      if (r.ok) {
        const data = await r.json()
        setSettings(data)
      } else {
        setMessage("Fehler beim Laden der Einstellungen")
      }
    } catch (error) {
      setMessage("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage("")

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers.Authorization = `Bearer ${token}`
      const r = await fetch("/dbp-admin/api/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(settings),
      })

      if (r.ok) {
        setMessage("Einstellungen gespeichert")
      } else {
        const data = await r.json()
        setMessage(data.message || "Fehler beim Speichern")
      }
    } catch (error) {
      setMessage("Netzwerkfehler")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 30 }}>Lädt...</div>

  return (
    <div style={{ padding: 30, maxWidth: 800 }}>
      <h1>Systemeinstellungen</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Konfigurieren Sie die Systemeinstellungen für Zahlungen und andere Dienste.
      </p>

      <div style={{ padding: 20, background: "#fafafa", borderRadius: 8 }}>
        <h2 style={{ marginBottom: 20 }}>Stripe-Zahlungskonfiguration</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Stripe Publishable Key
          </label>
          <input
            type="text"
            value={settings.stripe_publishable_key}
            onChange={(e) => setSettings({ ...settings, stripe_publishable_key: e.target.value })}
            placeholder="pk_test_..."
            style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
          />
          <small style={{ color: "#666" }}>
            Dieser Key wird im Frontend verwendet und ist öffentlich sichtbar.
          </small>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Stripe Secret Key
          </label>
          <input
            type="password"
            value={settings.stripe_secret_key}
            onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })}
            placeholder="sk_test_..."
            style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
          />
          <small style={{ color: "#666" }}>
            Dieser Key wird nur im Backend verwendet und sollte geheim gehalten werden.
          </small>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Stripe Webhook Secret
          </label>
          <input
            type="password"
            value={settings.stripe_webhook_secret}
            onChange={(e) => setSettings({ ...settings, stripe_webhook_secret: e.target.value })}
            placeholder="whsec_..."
            style={{ width: "100%", padding: 8, fontFamily: "monospace" }}
          />
          <small style={{ color: "#666" }}>
            Secret für die Validierung eingehender Webhooks von Stripe.
          </small>
        </div>

        {message && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: message.includes("Fehler") ? "#fee" : "#dfd",
            borderRadius: 8
          }}>
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px" }}>
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>

      <div style={{ marginTop: 30, padding: 20, background: "#fff3cd", borderRadius: 8, border: "1px solid #ffeaa7" }}>
        <h3 style={{ marginTop: 0, color: "#856404" }}>⚠️ Sicherheitshinweis</h3>
        <p style={{ marginBottom: 0, color: "#856404" }}>
          Die Stripe-Keys sind sensible Informationen. Stellen Sie sicher, dass nur autorisierte Administratoren
          Zugriff auf diese Seite haben. Die Keys werden in der Datenbank gespeichert und sollten regelmäßig rotiert werden.
        </p>
      </div>
    </div>
  )
}