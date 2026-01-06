"use client"
import { useEffect, useState } from "react"

type Order = {
  id: string
  status?: string
  totalPriceCents?: number
  currency?: string
  customer_email?: string
  created_at?: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      const r = await fetch("/dbp-admin/api/orders", { headers })
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
              <th style={{ textAlign: "left", padding: 8 }}>Status</th>
              <th style={{ textAlign: "right", padding: 8 }}>Total</th>
              <th style={{ textAlign: "left", padding: 8 }}>E-Mail</th>
              <th style={{ textAlign: "left", padding: 8 }}>Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{o.id}</td>
                <td style={{ padding: 8 }}>{o.status ?? "-"}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{o.totalPriceCents != null ? (o.totalPriceCents / 100).toFixed(2) + " " + (o.currency ?? "EUR") : "-"}</td>
                <td style={{ padding: 8 }}>{o.customer_email ?? "-"}</td>
                <td style={{ padding: 8 }}>{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={load} style={{ padding: "8px 14px" }}>Neu laden</button>
      </div>
    </div>
  )
}
