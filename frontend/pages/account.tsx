"use client"
import React, { useEffect, useState } from "react"
import HeaderMenu from "../components/HeaderMenu"

type Order = any

export default function AccountPage() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("user_token")
    const pk = process.env.NEXT_PUBLIC_API_KEY || ""
    if (!token) {
      setError("Bitte zuerst einloggen")
      return
    }

    setLoading(true)
    fetch("/api/store/orders", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(pk ? { "x-publishable-api-key": pk } : {}),
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data)
        else if (data.orders) setOrders(data.orders)
        else setOrders([])
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <HeaderMenu />
      <main style={{ maxWidth: 960, margin: "32px auto", padding: "0 16px" }}>
        <h1>Meine Käufe</h1>
        {loading && <div>Lädt...</div>}
        {error && <div style={{ color: "#d00" }}>{error}</div>}
        {!loading && !error && orders && orders.length === 0 && <div>Keine Bestellungen gefunden.</div>}
        {!loading && orders && orders.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {orders.map((o: Order) => (
              <div key={o.id || o.order_id || Math.random()} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Bestellung #{o.id || o.order_id}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{new Date(o.created_at || o.created || Date.now()).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>{o.total ? `${o.total} ${o.currency_code || "EUR"}` : "-"}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>{o.status || "-"}</div>
                  </div>
                </div>

                <div>
                  <h4>Artikel</h4>
                  <ul>
                    {(o.items || o.order_items || []).map((it: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>{it.title || it.name || it.product_title || "Produkt"}</div>
                        <div style={{ fontSize: 13, color: "#444" }}>{it.unit_price ? `${it.unit_price} ${o.currency_code||"EUR"}` : ""}</div>
                        {it.variant && it.variant.files && it.variant.files.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            {it.variant.files.map((f: any) => (
                              <div key={f.id || f.filename}>
                                <a href={f.download_url || f.url || f.path} target="_blank" rel="noreferrer" download>
                                  {f.original_name || f.filename || "Herunterladen"}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
