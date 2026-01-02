"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

type Product = {
  id: number
  audio_file_id: number
  title: string
  description: string | null
  status: string
  category_id: number | null
  tag_ids: number[]
}

type Category = {
  id: number
  name: string
}

type Tag = {
  id: number
  name: string
}

type LicenseModel = {
  id: number
  name: string
  description: string | null
  price_cents: number
}

type Variant = {
  id: number
  license_model_id: number
  license_model_name: string
  name: string
  price_cents: number
  status: string
}

type VariantFile = {
  id: number
  original_name: string
  size: number
  download_url: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [licenseModels, setLicenseModels] = useState<LicenseModel[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [variantFiles, setVariantFiles] = useState<Map<number, VariantFile[]>>(new Map())

  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "draft",
    category_id: 0,
    tag_ids: [] as number[],
  })

  const [newVariantLicense, setNewVariantLicense] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(id)) return

    Promise.all([
      fetch(`/api/products/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
      fetch("/api/license-models").then((r) => r.json()),
      fetch(`/api/products/${id}/variants`).then((r) => r.json()),
    ]).then(([productData, catData, tagData, licenseData, variantData]) => {
      setProduct(productData)
      setFormData({
        title: productData.title ?? "",
        description: productData.description ?? "",
        status: productData.status ?? "draft",
        category_id: productData.category_id ?? 0,
        tag_ids: Array.isArray(productData.tag_ids) ? productData.tag_ids : [],
      })
      setCategories(Array.isArray(catData.items) ? catData.items : [])
      setTags(Array.isArray(tagData.items) ? tagData.items : [])
      setLicenseModels(Array.isArray(licenseData.items) ? licenseData.items : [])
      setVariants(Array.isArray(variantData.items) ? variantData.items : [])
    })
  }, [id])

  useEffect(() => {
    variants.forEach((v) => {
      if (!variantFiles.has(v.id)) {
        fetch(`/api/products/${id}/variants/${v.id}/files`)
          .then((r) => r.json())
          .then((data) => {
            setVariantFiles((prev) => {
              const next = new Map(prev)
              next.set(v.id, Array.isArray(data.items) ? data.items : [])
              return next
            })
          })
      }
    })
  }, [variants, id, variantFiles])

  async function handleSave() {
    const r = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
    if (r.ok) {
      const updated = await r.json()
      setProduct(updated)
      setEditMode(false)
    }
  }

  async function handleAddVariant() {
    if (!newVariantLicense) return
    const r = await fetch(`/api/products/${id}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_model_id: newVariantLicense }),
    })
    if (r.ok) {
      const created = await r.json()
      setVariants((prev) => [...prev, created])
      setNewVariantLicense(0)
    }
  }

  async function handleDeleteVariant(variantId: number) {
    if (!confirm("Variante löschen?")) return
    const r = await fetch(`/api/products/${id}/variants/${variantId}`, { method: "DELETE" })
    if (r.ok) {
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
      setVariantFiles((prev) => {
        const next = new Map(prev)
        next.delete(variantId)
        return next
      })
    }
  }

  async function handleUploadFile(variantId: number) {
    const input = document.createElement("input")
    input.type = "file"
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return

      const r = await fetch(`/api/products/${id}/variants/${variantId}/files?filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(file.type)}`, {
        method: "POST",
        body: file,
      })
      if (r.ok) {
        const created = await r.json()
        setVariantFiles((prev) => {
          const next = new Map(prev)
          const existing = next.get(variantId) || []
          next.set(variantId, [...existing, created])
          return next
        })
      }
    }
    input.click()
  }

  async function handleDeleteFile(variantId: number, fileId: number) {
    if (!confirm("Datei löschen?")) return
    const r = await fetch(`/api/products/${id}/variants/${variantId}/files/${fileId}`, { method: "DELETE" })
    if (r.ok) {
      setVariantFiles((prev) => {
        const next = new Map(prev)
        const existing = next.get(variantId) || []
        next.set(variantId, existing.filter((f) => f.id !== fileId))
        return next
      })
    }
  }

  if (!product) return <div style={{ padding: 30 }}>Lädt...</div>

  return (
    <div style={{ padding: 30 }}>
      <button onClick={() => router.push("/products")} style={{ marginBottom: 20 }}>
        ← Zurück
      </button>

      <h1>Produkt: {product.title}</h1>

      <div style={{ marginBottom: 30, padding: 20, background: "#fafafa", borderRadius: 8 }}>
        {editMode ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: "100%", padding: 8, minHeight: 80 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ padding: 8 }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Kategorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                style={{ padding: 8 }}
              >
                <option value={0}>Keine</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Tags</label>
              {tags.map((t) => (
                <label key={t.id} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={formData.tag_ids.includes(t.id)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setFormData({
                        ...formData,
                        tag_ids: checked
                          ? [...formData.tag_ids, t.id]
                          : formData.tag_ids.filter((id) => id !== t.id),
                      })
                    }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
            <button onClick={handleSave} style={{ marginRight: 8 }}>
              Speichern
            </button>
            <button onClick={() => setEditMode(false)}>Abbrechen</button>
          </div>
        ) : (
          <div>
            <p>
              <strong>Titel:</strong> {product.title}
            </p>
            <p>
              <strong>Beschreibung:</strong> {product.description || "–"}
            </p>
            <p>
              <strong>Status:</strong> {product.status}
            </p>
            <button onClick={() => setEditMode(true)}>Bearbeiten</button>
          </div>
        )}
      </div>

      <h2>Varianten (Lizenzmodelle)</h2>
      <div style={{ marginBottom: 30 }}>
        {variants.length === 0 ? (
          <p>Keine Varianten vorhanden.</p>
        ) : (
          variants.map((v) => {
            const files = variantFiles.get(v.id) || []
            return (
              <div
                key={v.id}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{v.name}</div>
                    <div style={{ color: "#666", fontSize: 14 }}>
                      Lizenzmodell: {v.license_model_name} · Preis: {(v.price_cents / 100).toFixed(2)}€
                    </div>
                  </div>
                  <button onClick={() => handleDeleteVariant(v.id)} style={{ background: "#d00", color: "#fff" }}>
                    Löschen
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <strong>Dateien:</strong>
                  {files.length === 0 ? (
                    <p style={{ color: "#999", fontSize: 13 }}>Keine Dateien angehängt.</p>
                  ) : (
                    <ul style={{ marginTop: 8 }}>
                      {files.map((f) => (
                        <li key={f.id} style={{ marginBottom: 8 }}>
                          <a href={f.download_url} target="_blank" rel="noopener noreferrer">
                            {f.original_name}
                          </a>{" "}
                          ({(f.size / 1024).toFixed(1)} KB)
                          <button
                            onClick={() => handleDeleteFile(v.id, f.id)}
                            style={{ marginLeft: 12, fontSize: 12, padding: "2px 8px", background: "#d00", color: "#fff" }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button onClick={() => handleUploadFile(v.id)} style={{ marginTop: 8 }}>
                    + Datei hochladen
                  </button>
                </div>
              </div>
            )
          })
        )}

        <div style={{ marginTop: 20, padding: 16, background: "#fafafa", borderRadius: 8 }}>
          <h3>Neue Variante hinzufügen</h3>
          <select
            value={newVariantLicense}
            onChange={(e) => setNewVariantLicense(Number(e.target.value))}
            style={{ padding: 8, marginRight: 12 }}
          >
            <option value={0}>Lizenzmodell wählen</option>
            {licenseModels.map((lm) => (
              <option key={lm.id} value={lm.id}>
                {lm.name} ({(lm.price_cents / 100).toFixed(2)}€)
              </option>
            ))}
          </select>
          <button onClick={handleAddVariant} disabled={!newVariantLicense}>
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  )
}
