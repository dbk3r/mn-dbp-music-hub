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
          let allOrders: Order[] = []
          if (Array.isArray(data)) allOrders = data
          else if (data && data.orders) allOrders = data.orders
          
          // Filter: Nur paid Orders anzeigen
          const paidOrders = allOrders.filter((o: any) => o.status === 'paid')
          setOrders(paidOrders)
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
      <main className="orders-container">
        <h1 className="orders-title">Meine Bestellungen</h1>

        {loading && <div className="orders-loading">Lädt...</div>}
        {error && <div className="orders-error">{error}</div>}

        {!loading && !error && orders && orders.length === 0 && <div className="orders-empty">Keine Bestellungen gefunden.</div>}

        {!loading && orders && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((o: Order) => (
              <article key={o.id || o.order_id} className="order-card">
                <div className="order-header">
                  <div className="order-id">Bestellung #{o.id || o.order_id}</div>
                  {o.license_number && (
                    <div className="order-license" style={{ fontSize: 13, color: "#666" }}>
                      🔒 {o.license_number}
                    </div>
                  )}
                  <div className="order-date">{new Date(o.created_at || o.created || Date.now()).toLocaleString()}</div>
                </div>
                <div className="order-summary">
                  <span className={`order-status order-status-${o.status || 'unknown'}`}>
                    {o.status === 'paid' ? 'Bezahlt' : 
                     o.status === 'pending' ? 'Ausstehend' : 
                     o.status === 'cancelled' ? 'Storniert' : 
                     o.status === 'delivered' ? 'Geliefert' : 
                     o.status || '-'}
                  </span>
                  <span className="order-total">{o.total ? `${o.total} ${o.currency_code || "EUR"}` : "-"}</span>
                </div>
                <div className="order-items">
                  {(o.items || o.order_items || []).map((it: any, i: number) => (
                    <div key={i} className="order-item">
                      <div className="order-item-header">
                        <div className="order-item-title">{it.title || it.name || it.product_title || "Produkt"}</div>
                        <div className="order-item-price">{it.unit_price ? `${it.unit_price} ${o.currency_code || "EUR"}` : ""}</div>
                      </div>
                      {it.variant && (it.variant.name || it.variant.license_model_name) && (
                        <div className="order-item-variant">
                          <span className="variant-label">Lizenz:</span>
                          <span className="variant-name">{it.variant.name || it.variant.license_model_name}</span>
                        </div>
                      )}
                      <div className="order-item-downloads">
                        {it.variant && it.variant.files && it.variant.files.length > 0 ? (
                          <div className="download-list">
                            {it.variant.files.map((f: any, idx: number) => (
                              <a key={f.id || f.filename} href={f.download_url || f.url || f.path} target="_blank" rel="noreferrer" className="order-download-btn">
                                📥 Download {it.variant.files.length > 1 ? `${idx + 1}` : ""} ({f.original_name || f.filename})
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="order-no-downloads">Keine Downloads</div>
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
