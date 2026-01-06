"use client"
import { useState, useEffect } from "react"

type PayPalSettings = {
  paypal_mode: string
  paypal_prod_client_id: string
  paypal_prod_secret: string
  paypal_sandbox_client_id: string
  paypal_sandbox_secret: string
}

export default function PayPalSettingsPage() {
  const [settings, setSettings] = useState<PayPalSettings>({
    paypal_mode: "sandbox",
    paypal_prod_client_id: "",
    paypal_prod_secret: "",
    paypal_sandbox_client_id: "",
    paypal_sandbox_secret: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const r = await fetch("/dbp-admin/api/paypal-settings", { headers })
      if (!r.ok) throw new Error("Failed")
      const data = await r.json()
      setSettings({
        paypal_mode: data.paypal_mode ?? "sandbox",
        paypal_prod_client_id: data.paypal_prod_client_id ?? "",
        paypal_prod_secret: data.paypal_prod_secret ?? "",
        paypal_sandbox_client_id: data.paypal_sandbox_client_id ?? "",
        paypal_sandbox_secret: data.paypal_sandbox_secret ?? "",
      })
    } catch (err) {
      setMessage("Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaving(true)
    setMessage("")
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers.Authorization = `Bearer ${token}`
      const r = await fetch("/dbp-admin/api/paypal-settings", {
        method: "POST",
        headers,
        body: JSON.stringify(settings),
      })
      if (!r.ok) throw new Error("Failed")
      setMessage("Gespeichert")
    } catch (err) {
      setMessage("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 30 }}>Lädt...</div>

  return (
    <div style={{ padding: 30, maxWidth: 900 }}>
      <h1>PayPal Einstellungen</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Konfigurieren Sie PayPal-Zugangsdaten für Produktions- und Sandbox-Modus.</p>

      <div style={{ padding: 20, background: "#fafafa", borderRadius: 8 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Aktiver Modus</label>
          <select value={settings.paypal_mode} onChange={(e) => setSettings({ ...settings, paypal_mode: e.target.value })} style={{ padding: 8 }}>
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </div>

        <h3>Production</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Client ID (Production)</label>
          <input type="text" value={settings.paypal_prod_client_id} onChange={(e) => setSettings({ ...settings, paypal_prod_client_id: e.target.value })} style={{ padding: 8, width: "100%" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Secret (Production)</label>
          <input type="text" value={settings.paypal_prod_secret} onChange={(e) => setSettings({ ...settings, paypal_prod_secret: e.target.value })} style={{ padding: 8, width: "100%" }} />
        </div>

        <h3>Sandbox</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Client ID (Sandbox)</label>
          <input type="text" value={settings.paypal_sandbox_client_id} onChange={(e) => setSettings({ ...settings, paypal_sandbox_client_id: e.target.value })} style={{ padding: 8, width: "100%" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Secret (Sandbox)</label>
          <input type="text" value={settings.paypal_sandbox_secret} onChange={(e) => setSettings({ ...settings, paypal_sandbox_secret: e.target.value })} style={{ padding: 8, width: "100%" }} />
        </div>

        {message && <div style={{ marginBottom: 12, padding: 8, background: message.includes("Fehler") ? "#fee" : "#dfd", borderRadius: 6 }}>{message}</div>}

        <button onClick={save} disabled={saving} style={{ padding: "10px 20px" }}>{saving ? "Speichert..." : "Speichern"}</button>
      </div>
    </div>
  )
}
