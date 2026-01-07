"use client"
import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

type ShopSettings = {
  shop_tax_rate: string
  shop_display_tax_breakdown: string
  shop_show_prices_with_tax: string
}

export default function StripeSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
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

  if (loading) return <div style={{ padding: 30 }}>Lädt...</div>

  return (
    <div style={{ padding: 30, maxWidth: 800 }}>
      <h1>Stripe-Verwaltung</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Verwalten Sie Stripe-/Shop-spezifische Einstellungen wie Steuersatz und Anzeigeoptionen.</p>

      <div style={{ padding: 20, background: "#fafafa", borderRadius: 8 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Steuersatz (dezimal, z.B. 0.19)</label>
          <input type="text" value={settings.shop_tax_rate} onChange={(e) => setSettings({ ...settings, shop_tax_rate: e.target.value })} style={{ padding: 8, width: "100%" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Steueraufteilung anzeigen</label>
          <select value={settings.shop_display_tax_breakdown} onChange={(e) => setSettings({ ...settings, shop_display_tax_breakdown: e.target.value })} style={{ padding: 8 }}>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Preise inklusive Steuer anzeigen</label>
          <select value={settings.shop_show_prices_with_tax} onChange={(e) => setSettings({ ...settings, shop_show_prices_with_tax: e.target.value })} style={{ padding: 8 }}>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </div>

        {message && <div style={{ marginBottom: 12, padding: 8, background: message.includes("Fehler") ? "#fee" : "#dfd", borderRadius: 6 }}>{message}</div>}

        <button onClick={save} disabled={saving} style={{ padding: "10px 20px" }}>{saving ? "Speichert..." : "Speichern"}</button>
      </div>
    </div>
  )
}
