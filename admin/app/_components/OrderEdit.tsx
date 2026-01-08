"use client"
import { useState } from "react"
import { adminApiUrl } from "../_lib/api"

type Props = {
  order: any
  onClose: () => void
  onSaved: () => void
}

export default function OrderEdit({ order, onClose, onSaved }: Props) {
  const [status, setStatus] = useState(order.status || "")
  const [total, setTotal] = useState(order.totalPriceCents != null ? (order.totalPriceCents / 100).toFixed(2) : "")
  const [currency, setCurrency] = useState(order.currency || "EUR")
  const [email, setEmail] = useState(order.customer_email || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseItems = () => {
    try {
      if (!order.items) return []
      return typeof order.items === "string" ? JSON.parse(order.items) : order.items
    } catch (e) {
      return []
    }
  }

  const [items, setItems] = useState<any[]>(parseItems())
  const [generatingPdf, setGeneratingPdf] = useState(false)

  function updateItem(idx: number, key: string, val: any) {
    const copy = items.slice()
    copy[idx] = { ...(copy[idx] || {}), [key]: val }
    setItems(copy)
  }

  function addItem() {
    setItems([...items, { title: "", quantity: 1, unitPrice: 0 }])
  }

  function removeItem(idx: number) {
    const copy = items.slice()
    copy.splice(idx, 1)
    setItems(copy)
  }

  const derivedTotalCents = items.reduce((sum, it) => {
    const q = Number(it.quantity) || 0
    const up = Number(it.unitPrice) || 0
    return sum + Math.round(q * up * 100)
  }, 0)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      if (!status) throw new Error("Status ist erforderlich")
      const token = localStorage.getItem("admin_auth_token")
      const body: any = { status }
      // If items present, send them as JSON
      if (items && items.length) body.items = items
      // If user provided total explicitly, use it, otherwise use derived total
      const totalCents = total !== "" ? Math.round(parseFloat(total) * 100) : derivedTotalCents
      if (Number.isNaN(totalCents)) throw new Error("Ungültiges Total")
      body.totalPriceCents = totalCents
      if (currency) body.currencyCode = currency
      if (email) body.customer_email = email

      const r = await fetch(adminApiUrl(`/orders/${order.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error(await r.text())
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm("Bestellung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return
    setSaving(true)
    setError(null)
    try {
      const token = localStorage.getItem("admin_auth_token")
      const r = await fetch(adminApiUrl(`/orders/${order.id}`), {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!r.ok) throw new Error(await r.text())
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  async function generatePdf() {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
    if (!token) return

    setGeneratingPdf(true)
    setError(null)

    try {
      // Backend route via HAProxy
      const res = await fetch(`/dbp-backend/custom/admin/orders/${order.order_id}/generate-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "PDF-Generierung fehlgeschlagen")
      }

      const data = await res.json()
      alert(`PDFs generiert!\n${data.results.filter((r: any) => r.success).length} erfolgreich, ${data.results.filter((r: any) => !r.success).length} fehlgeschlagen`)
      onSaved() // Reload to show new files
    } catch (err) {
      setError(String(err))
      alert("Fehler: " + String(err))
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div style={{ position: "fixed", left: 0, top: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "white", padding: 20, width: 760, maxHeight: "90vh", overflow: "auto", borderRadius: 6 }}>
        <h2>Bestellung bearbeiten</h2>
        {error && <div style={{ color: "#900", marginBottom: 8 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#444" }}>Status</label>
            {(() => {
              const STATUS_OPTIONS: string[] = [
                "pending",
                "paid",
                "cancelled",
                "delivered",
              ]
              const LABELS: Record<string, string> = {
                pending: "Ausstehend",
                paid: "Bezahlt",
                cancelled: "Storniert",
                delivered: "Ausgeliefert",
              }
              return (
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: 8 }}>
                  <option value="">-- wählen --</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{LABELS[s] || s}</option>
                  ))}
                </select>
              )
            })()}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#444" }}>Total (z. B. 19.99)</label>
            <input value={total} onChange={(e) => setTotal(e.target.value)} style={{ width: "100%", padding: 8 }} placeholder={(derivedTotalCents/100).toFixed(2)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#444" }}>Currency</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#444" }}>Buyer Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <h3>Items</h3>
          {items.length === 0 && <div style={{ color: "#666", marginBottom: 8 }}>Keine Positionen.</div>}
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input placeholder="Titel" value={it.title || ""} onChange={(e) => updateItem(idx, "title", e.target.value)} style={{ padding: 8 }} />
              <input placeholder="Menge" type="number" value={String(it.quantity || 1)} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} style={{ padding: 8 }} />
              <input placeholder="Stückpreis" value={String(it.unitPrice || 0)} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value))} style={{ padding: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => removeItem(idx)} style={{ background: "#900", color: "white" }}>Entfernen</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button onClick={addItem}>Position hinzufügen</button>
          </div>
          <div style={{ marginTop: 8, color: "#444" }}>Berechnetes Total: {(derivedTotalCents/100).toFixed(2)} {currency}</div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "space-between" }}>
          <button 
            onClick={generatePdf} 
            disabled={generatingPdf || !order.order_id}
            style={{ background: "#28a745", color: "white" }}
          >
            {generatingPdf ? "Generiert PDFs..." : "📄 Lizenz-PDFs generieren"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} disabled={saving}>Abbrechen</button>
            <button onClick={save} style={{ background: "#0a84ff", color: "white" }} disabled={saving}>{saving ? "Speichert..." : "Speichern"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
