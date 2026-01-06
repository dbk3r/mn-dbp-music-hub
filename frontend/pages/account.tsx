"use client"
import React, { useEffect, useState } from "react"
import HeaderMenu from "../components/HeaderMenu"

type Order = any

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // compatibility no-op in case leftover calls to setDebugInfo exist elsewhere
  const setDebugInfo = (_: any) => {}

  useEffect(() => {
    const token = localStorage.getItem("user_token")
    const pk = process.env.NEXT_PUBLIC_API_KEY || ""
    const stored = localStorage.getItem("user_data")

    if (!token) {
      setError("Bitte zuerst einloggen")
      return
    }

    // rudimentärer Rollencheck: prüfe gängige Felder auf Admin-Rechte
    let isAdmin = false
    try {
      if (stored) {
        const u = JSON.parse(stored)
        if (u) {
          if (u.is_admin) isAdmin = true
          if (Array.isArray(u.roles) && u.roles.includes("admin")) isAdmin = true
          if (typeof u.role === "string" && /(admin|administrator)/i.test(u.role)) isAdmin = true
        }
      }
    } catch (e) {
      // ignore parse errors
    }

    const endpoint = isAdmin ? "/api/admin/orders" : "/api/store/orders"

    setLoading(true)
    fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(pk ? { "x-publishable-api-key": pk } : {}),
      },
    })
      .then(async (r) => {
        const text = await r.text()
        let data: any = null
        try {
          data = text ? JSON.parse(text) : null
        } catch (e) {
          data = text
        }
        // debug info removed

        // If store endpoint rejects with 401, try admin endpoint as fallback
        if (!r.ok && r.status === 401 && endpoint === "/api/store/orders") {
          try {
            const ar = await fetch("/api/admin/orders", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(pk ? { "x-publishable-api-key": pk } : {}),
              },
            })
            const atext = await ar.text()
            let adata: any = null
            try { adata = atext ? JSON.parse(atext) : null } catch (e) { adata = atext }
            if (ar.ok) {
              if (Array.isArray(adata)) setOrders(adata)
              else if (adata && adata.orders) setOrders(adata.orders)
              else setOrders([])
            } else {
              setError(typeof adata === 'string' ? adata : JSON.stringify(adata))
            }
            return
          } catch (e) {
            setError(String(e))
            return
          }
        }

        if (r.ok) {
          if (Array.isArray(data)) setOrders(data)
          else if (data && data.orders) setOrders(data.orders)
          else setOrders([])
        } else {
          setError(typeof data === 'string' ? data : JSON.stringify(data))
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  

  return (
    <div>
      <HeaderMenu />
      <main style={{ maxWidth: 980, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ marginBottom: 16 }}>Meine Käufe</h1>
        {loading && <div>Lädt...</div>}
        {error && <div style={{ color: "#d00" }}>{error}</div>}
        {!loading && !error && orders && orders.length === 0 && <div>Keine Bestellungen gefunden.</div>}

        {!loading && orders && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((o: Order) => (
              <article key={o.id || o.order_id || Math.random()} style={{ border: "1px solid #eee", borderRadius: 10, padding: 16, background: "#fff" }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>Bestellung #{o.id || o.order_id}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{new Date(o.created_at || o.created || Date.now()).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{o.total ? `${o.total} ${o.currency_code || "EUR"}` : "-"}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{o.status || "-"}</div>
                  </div>
                </header>

                <section>
                  <h4 style={{ margin: "0 0 8px 0" }}>Artikel</h4>
                  <div style={{ display: "grid", gap: 12 }}>
                    {(o.items || o.order_items || []).map((it: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 8, border: "1px solid #f5f5f5" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{it.title || it.name || it.product_title || "Produkt"}</div>
                          <div style={{ fontSize: 13, color: "#444" }}>{it.unit_price ? `${it.unit_price} ${o.currency_code || "EUR"}` : ""}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                          {it.variant && it.variant.files && it.variant.files.length > 0 ? (
                            it.variant.files.map((f: any) => (
                              <a key={f.id || f.filename} href={f.download_url || f.url || f.path} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "8px 12px", background: "#0070f3", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 13 }}>
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
                </section>
              </article>
            ))}
          </div>
        )}
        
      </main>
    </div>
  )
}
