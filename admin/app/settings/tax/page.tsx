"use client"
import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

type TaxSettings = {
  shop_tax_rate: string
  shop_display_tax_breakdown: string
  shop_show_prices_with_tax: string
}

export default function TaxSettingsPage() {
  const [settings, setSettings] = useState<TaxSettings>({
    shop_tax_rate: "0.19",
    shop_display_tax_breakdown: "true",
    shop_show_prices_with_tax: "false",
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
      const r = await fetch(adminApiUrl("/shop-settings"), { headers })
      if (!r.ok) throw new Error("Failed")
      const data = await r.json()
      setSettings({
        shop_tax_rate: data.shop_tax_rate ?? "0.19",
        shop_display_tax_breakdown: String(data.shop_display_tax_breakdown ?? "true"),
        shop_show_prices_with_tax: String(data.shop_show_prices_with_tax ?? "false"),
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
      const r = await fetch(adminApiUrl("/shop-settings"), {
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
        <h1 className="text-2xl font-semibold">Steuer-Einstellungen</h1>
        <p className="text-sm text-foreground/70">
          Verwalten Sie Steuer-Einstellungen, die für Preise und Rechnungen gelten.
        </p>
      </div>

      <div className="rounded border border-foreground/10 p-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Steuersatz (dezimal, z.B. 0.19)</label>
            <input 
              type="text" 
              value={settings.shop_tax_rate} 
              onChange={(e) => setSettings({ ...settings, shop_tax_rate: e.target.value })} 
              className="h-10 w-full rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Steueraufteilung anzeigen</label>
            <select 
              value={settings.shop_display_tax_breakdown} 
              onChange={(e) => setSettings({ ...settings, shop_display_tax_breakdown: e.target.value })} 
              className="h-10 rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
            >
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Preise inklusive Steuer anzeigen</label>
            <select 
              value={settings.shop_show_prices_with_tax} 
              onChange={(e) => setSettings({ ...settings, shop_show_prices_with_tax: e.target.value })} 
              className="h-10 rounded border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-foreground/30"
            >
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
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
