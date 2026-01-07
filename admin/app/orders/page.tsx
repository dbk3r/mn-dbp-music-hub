"use client"
import { useEffect, useState } from "react"
import OrderEdit from "../_components/OrderEdit"
import { adminApiUrl } from "../_lib/api"

type Order = {
  id: string
  customer_name?: string
  status?: string
  totalPriceCents?: number
  currency?: string
  customer_email?: string
  product_titles?: string[] | string
  created_at?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const r = await fetch(adminApiUrl("/orders"), { headers })
      if (!r.ok) {
        const txt = await r.text()
        throw new Error(`Fehler: ${r.status} ${txt}`)
      }
      const data = await r.json()
      // Expect an array or object with items
      const list: Order[] = Array.isArray(data) ? data : data.items ?? data.orders ?? []
      setOrders(list)
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Bestellungen")
      setOrders(null)
    } finally {
      setLoading(false)
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("Bestellung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const r = await fetch(adminApiUrl(`/orders/${id}`), {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!r.ok) {
        const txt = await r.text()
        throw new Error(txt || `Status ${r.status}`)
      }
      await load()
    } catch (e: any) {
      alert("Löschen fehlgeschlagen: " + (e.message || String(e)))
    }
  }

  if (loading) return <div style={{ padding: 30 }}>Lädt Bestellungen...</div>

  return (
    <div style={{ padding: 30 }}>
      <h1>Bestellungen</h1>
      {error && <div style={{ marginBottom: 12, color: "#900" }}>{error}</div>}

      {!orders || orders.length === 0 ? (
        <div>Keine Bestellungen gefunden.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", padding: 8 }}>Käufer</th>
              <th style={{ textAlign: "left", padding: 8 }}>E-Mail</th>
              <th style={{ textAlign: "left", padding: 8 }}>Produkt(e)</th>
              <th style={{ textAlign: "left", padding: 8 }}>Status</th>
              <th style={{ textAlign: "right", padding: 8 }}>Total</th>
              <th style={{ textAlign: "left", padding: 8 }}>Erstellt</th>
              <th style={{ textAlign: "left", padding: 8 }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.id}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.customer_name ?? "-"}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.customer_email ?? "-"}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>
                  {Array.isArray(o.product_titles) && o.product_titles.length > 0 ? (
                    o.product_titles.map((pt: string, i: number) => (
                      <div key={i} style={{ marginBottom: 4 }}>{pt}</div>
                    ))
                  ) : Array.isArray((o as any).items) && (o as any).items.length > 0 ? (
                    (o as any).items.map((it: any, i: number) => (
                      <div key={i} style={{ marginBottom: 4 }}>{it.title ? `${it.title}${it.license_model_name ? ` (${it.license_model_name})` : ""}` : it.name || ""}</div>
                    ))
                  ) : (
                    <div>-</div>
                  )}
                </td>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.status ?? "-"}</td>
                <td style={{ padding: 8, textAlign: "right", verticalAlign: "top" }}>{o.totalPriceCents != null ? (o.totalPriceCents / 100).toFixed(2) + " " + (o.currency ?? "EUR") : "-"}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>
                  <span onClick={() => setEditing(o)} title="Bearbeiten" style={{ cursor: "pointer", marginRight: 8, display: "inline-block", width: 20, height: 20 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#0a84ff" />
                      <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#0a84ff" />
                    </svg>
                  </span>
                  <span onClick={() => deleteOrder(o.id)} title="Löschen" style={{ cursor: "pointer", display: "inline-block", width: 20, height: 20 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" fill="#900" />
                      <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#900" />
                    </svg>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={load} style={{ padding: "8px 14px" }}>Neu laden</button>
      </div>
      {editing && (
        <OrderEdit
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}
