"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

type Product = {
  id: number
  audio_file_id: number
  title: string
  description: string | null
  status: string
  category: { id: number; name: string } | null
  tags: Array<{ id: number; name: string }>
  audio: {
    artist: string | null
    duration_ms: number | null
    stream_url: string
    cover_url: string | null
  } | null
  variants: Array<{
    id: number
    license_model_id: number
    license_model_name: string
    name: string
    price_cents: number
    status: string
  }>
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data.items) ? data.items : []))
      .finally(() => setLoading(false))
  }, [])

  function formatPrice(cents: number) {
    return (cents / 100).toFixed(2)
  }

  if (loading) return <div style={{ padding: 30 }}>Lädt...</div>

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Produkte</h1>
        <Link href="/products/create">
          <button>+ Neues Produkt</button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p>Keine Produkte vorhanden.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: "12px 8px" }}>ID</th>
              <th style={{ padding: "12px 8px" }}>Titel</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
              <th style={{ padding: "12px 8px" }}>Kategorie</th>
              <th style={{ padding: "12px 8px" }}>Varianten</th>
              <th style={{ padding: "12px 8px" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px 8px" }}>{p.id}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  {p.audio?.artist && (
                    <div style={{ fontSize: 13, color: "#666" }}>{p.audio.artist}</div>
                  )}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: p.status === "draft" ? "#ffd" : "#dfd",
                    }}
                  >
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>{p.category?.name ?? "–"}</td>
                <td style={{ padding: "12px 8px" }}>
                  {p.variants.length === 0 ? (
                    <span style={{ color: "#999" }}>Keine</span>
                  ) : (
                    <div>
                      {p.variants.map((v) => (
                        <div key={v.id} style={{ fontSize: 13 }}>
                          {v.name} ({formatPrice(v.price_cents)}€)
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <Link href={`/products/${p.id}`}>
                    <button style={{ marginRight: 8 }}>Bearbeiten</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
