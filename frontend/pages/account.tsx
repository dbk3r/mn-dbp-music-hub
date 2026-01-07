"use client"
import React, { useEffect, useState } from "react"
import HeaderMenu from "../components/HeaderMenu"

type Order = any

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)

      const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : ""
      if (!token) {
        setError("Bitte zuerst einloggen")
        setLoading(false)
        return
      }

      const pk = process.env.NEXT_PUBLIC_API_KEY || ""

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        headers.Authorization = `Bearer ${token}`
        if (pk) headers["x-publishable-api-key"] = pk

        let r = await fetch("/api/store/orders", { headers })
        console.log(`[account] /api/store/orders response: ${r.status}`)

        // If store endpoint rejects with 401, try admin fallback
        if (r.status === 401) {
          console.log('[account] Fallback to /api/admin/orders')
          r = await fetch("/api/admin/orders", { headers })
          console.log(`[account] /api/admin/orders response: ${r.status}`)
        }

        const contentType = r.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await r.json()
          if (!mounted) return
          console.log('[account] Orders data:', JSON.stringify(data, null, 2))
          if (Array.isArray(data)) setOrders(data)
          else if (data && data.orders) setOrders(data.orders)
          else setOrders([])
        } else {
          const text = await r.text()
          if (!mounted) return
          setError(text || `Fehler (${r.status})`)
        }
      } catch (e: any) {
        if (!mounted) return
        setError(String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <HeaderMenu />
      <main style={{ maxWidth: 980, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ marginBottom: 16 }}>Meine Bestellungen</h1>

        {loading && <div>Lädt...</div>}
        {error && <div style={{ color: "#d00" }}>{error}</div>}

        {!loading && !error && orders && orders.length === 0 && <div>Keine Bestellungen gefunden.</div>}

        {!loading && orders && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((o: Order) => (
              <article key={o.id || o.order_id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Bestellung #{o.id || o.order_id}</div>
                  <div style={{ color: "#666" }}>{new Date(o.created_at || o.created || Date.now()).toLocaleString()}</div>
                </div>
                <div style={{ marginBottom: 8 }}>{o.status || "-"} — {o.total ? `${o.total} ${o.currency_code || "EUR"}` : "-"}</div>
                <div>
                  {(o.items || o.order_items || []).map((it: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: 8, borderTop: i === 0 ? undefined : "1px solid #f5f5f5" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{it.title || it.name || it.product_title || "Produkt"}</div>
                        <div style={{ fontSize: 13, color: "#444" }}>{it.unit_price ? `${it.unit_price} ${o.currency_code || "EUR"}` : ""}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {it.variant && it.variant.files && it.variant.files.length > 0 ? (
                          it.variant.files.map((f: any) => (
                            <a key={f.id || f.filename} href={f.download_url || f.url || f.path} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "6px 10px", background: "#0070f3", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 13, marginLeft: 8 }}>
                              {f.original_name || f.filename || "Herunterladen"}
                            </a>
                          ))
                        ) : (
                          <div style={{ fontSize: 13, color: "#999" }}>Keine Downloads</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
