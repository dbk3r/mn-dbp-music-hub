"use client"
import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

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
      const r = await fetch(adminApiUrl("/paypal-settings"), { headers })
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
      const r = await fetch(adminApiUrl("/paypal-settings"), {
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

  if (loading) return <div className="p-6">Lädt...</div>

  return (
    <div className="space-y-4 p-6" style={{ maxWidth: 900 }}>
      <div>
        <h1 className="text-2xl font-semibold">PayPal Einstellungen</h1>
        <p className="text-sm text-foreground/70">
          Konfigurieren Sie PayPal-Zugangsdaten für Produktions- und Sandbox-Modus.
        </p>
      </div>

      <div className="rounded border border-foreground/10 p-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Aktiver Modus</label>
            <select 
              value={settings.paypal_mode} 
              onChange={(e) => setSettings({ ...settings, paypal_mode: e.target.value })} 
              className="h-10 rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Production</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Client ID (Production)</label>
                <input 
                  type="text" 
                  value={settings.paypal_prod_client_id} 
                  onChange={(e) => setSettings({ ...settings, paypal_prod_client_id: e.target.value })} 
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Secret (Production)</label>
                <input 
                  type="password" 
                  value={settings.paypal_prod_secret} 
                  onChange={(e) => setSettings({ ...settings, paypal_prod_secret: e.target.value })} 
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Sandbox</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Client ID (Sandbox)</label>
                <input 
                  type="text" 
                  value={settings.paypal_sandbox_client_id} 
                  onChange={(e) => setSettings({ ...settings, paypal_sandbox_client_id: e.target.value })} 
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Secret (Sandbox)</label>
                <input 
                  type="password" 
                  value={settings.paypal_sandbox_secret} 
                  onChange={(e) => setSettings({ ...settings, paypal_sandbox_secret: e.target.value })} 
                  className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`rounded border p-3 text-sm ${
              message.includes("Fehler") 
                ? "border-red-500/50 bg-red-50 text-red-800" 
                : "border-green-500/50 bg-green-50 text-green-800"
            }`}>
              {message}
            </div>
          )}

          <button 
            onClick={save} 
            disabled={saving}
            className="h-10 rounded bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          >
            {saving ? "Speichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  )
}
