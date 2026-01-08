"use client"
import { useEffect, useMemo, useState } from "react"
import OrderEdit from "../_components/OrderEdit"
import { adminApiUrl } from "../_lib/api"

type Order = {
  id: string
  order_id?: string
  customer_name?: string
  status?: string
  totalPriceCents?: number
  currency?: string
  customer_email?: string
  product_titles?: string[] | string
  created_at?: string
  items?: any[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [search, setSearch] = useState("")

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
      console.log('[Orders] Response data:', data)
      console.log('[Orders] First order items:', data[0]?.items)
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

  async function resendEmail(orderId: string) {
    if (!confirm("Bestellbestätigung erneut per E-Mail versenden?")) return
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") : null
      const r = await fetch(`/dbp-backend/custom/admin/resend-order-email/${orderId}`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!r.ok) {
        const txt = await r.text()
        throw new Error(txt || `Status ${r.status}`)
      }
      const result = await r.json()
      alert(result.message || "E-Mail erfolgreich versendet")
    } catch (e: any) {
      alert("E-Mail-Versand fehlgeschlagen: " + (e.message || String(e)))
    }
  }

  const filteredOrders = useMemo(() => {
    if (!orders || !search.trim()) return orders
    const term = search.toLowerCase()
    return orders.filter((o) => {
      const productStr = Array.isArray(o.product_titles)
        ? o.product_titles.join(" ")
        : Array.isArray((o as any).items)
        ? (o as any).items.map((it: any) => it.title || it.name || "").join(" ")
        : ""
      return (
        o.id.toLowerCase().includes(term) ||
        (o.customer_name?.toLowerCase().includes(term) ?? false) ||
        (o.customer_email?.toLowerCase().includes(term) ?? false) ||
        (o.status?.toLowerCase().includes(term) ?? false) ||
        productStr.toLowerCase().includes(term)
      )
    })
  }, [orders, search])

  if (loading) return <div style={{ padding: 30 }}>Lädt Bestellungen...</div>

  return (
    <div style={{ padding: 30 }}>
      <h1>Bestellungen</h1>
      {error && <div style={{ marginBottom: 12, color: "#900" }}>{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Suchen... (ID, Käufer, E-Mail, Produkt, Status)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 600,
            height: 40,
            padding: "0 12px",
            border: "1px solid rgba(128, 128, 128, 0.3)",
            borderRadius: 4,
            fontSize: 14,
            outline: "none"
          }}
        />
      </div>

      {!filteredOrders || filteredOrders.length === 0 ? (
        <div>{search ? "Keine Treffer." : "Keine Bestellungen gefunden."}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", padding: 8 }}>Lizenz-Nr.</th>
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
            {filteredOrders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.id}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>
                  {(o as any).license_number ? (
                    <a 
                      href={`/dbp-backend/custom/verify-license/${(o as any).license_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0a84ff", textDecoration: "none", fontSize: 12 }}
                    >
                      {(o as any).license_number}
                    </a>
                  ) : "-"}
                </td>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.customer_name ?? "-"}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>{o.customer_email ?? "-"}</td>
                <td style={{ padding: 8, verticalAlign: "top" }}>
                  {Array.isArray((o as any).items) && (o as any).items.length > 0 ? (
                    (o as any).items.map((it: any, i: number) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 500 }}>{it.title || it.name || "-"}</div>
                        {it.variant && (
                          <div style={{ marginLeft: 12, marginTop: 4 }}>
                            <div style={{ fontSize: 13, color: "#666" }}>
                              📄 {it.variant.license_model_name}
                            </div>
                            {it.variant.files && it.variant.files.length > 0 && (
                              <div style={{ marginTop: 4, fontSize: 12 }}>
                                {it.variant.files.map((file: any, fi: number) => (
                                  <div key={fi} style={{ marginTop: 2 }}>
                                    <a 
                                      href={`/dbp-backend/custom/uploads/variants/${file.filename}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "#0a84ff", textDecoration: "none" }}
                                    >
                                      📎 {file.originalName || file.filename}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : Array.isArray(o.product_titles) && o.product_titles.length > 0 ? (
                    o.product_titles.map((pt: string, i: number) => (
                      <div key={i} style={{ marginBottom: 4 }}>{pt}</div>
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
                  <span onClick={() => resendEmail(o.order_id || o.id)} title="E-Mail erneut senden" style={{ cursor: "pointer", marginRight: 8, display: "inline-block", width: 20, height: 20 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#0a84ff" />
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
