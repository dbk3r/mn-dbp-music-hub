"use client"
import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

type StripeSettings = {
  stripe_secret_key: string
  stripe_publishable_key: string
  stripe_webhook_secret: string
}

export default function StripeSettingsPage() {
  const [settings, setSettings] = useState<StripeSettings>({
    stripe_secret_key: "",
    stripe_publishable_key: "",
    stripe_webhook_secret: "",
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
      const r = await fetch(adminApiUrl("/settings"), { headers })
      if (!r.ok) throw new Error("Failed")
      const data = await r.json()
      setSettings({
        stripe_secret_key: data.stripe_secret_key ?? "",
        stripe_publishable_key: data.stripe_publishable_key ?? "",
        stripe_webhook_secret: data.stripe_webhook_secret ?? "",
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
      const r = await fetch(adminApiUrl("/settings"), {
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
    <div className="space-y-4 p-6" style={{ maxWidth: 800 }}>
      <div>
        <h1 className="text-2xl font-semibold">Stripe-Einstellungen</h1>
        <p className="text-sm text-foreground/70">
          API-Schlüssel und Webhook-Konfiguration für Stripe-Zahlungen.
        </p>
      </div>

      <div className="rounded border border-foreground/10 p-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Secret Key</label>
            <input 
              type="password"
              value={settings.stripe_secret_key} 
              onChange={(e) => setSettings({ ...settings, stripe_secret_key: e.target.value })} 
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              placeholder="sk_test_..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Publishable Key</label>
            <input 
              type="text"
              value={settings.stripe_publishable_key} 
              onChange={(e) => setSettings({ ...settings, stripe_publishable_key: e.target.value })} 
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              placeholder="pk_test_..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Webhook Secret</label>
            <input 
              type="password"
              value={settings.stripe_webhook_secret} 
              onChange={(e) => setSettings({ ...settings, stripe_webhook_secret: e.target.value })} 
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
              placeholder="whsec_..."
            />
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
