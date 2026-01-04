"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { adminApiUrl } from "../../_lib/api"

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
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [variantFormData, setVariantFormData] = useState<{
    name: string
    price_cents: number
    status: string
    description: string
  }>({ name: "", price_cents: 0, status: "active", description: "" })

  useEffect(() => {
    if (!Number.isFinite(id)) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') : null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch(adminApiUrl(`/admin/products/${id}`), { headers }).then((r) => r.json()),
      fetch(adminApiUrl("/categories"), { headers }).then((r) => r.json()),
      fetch(adminApiUrl("/tags"), { headers }).then((r) => r.json()),
      fetch(adminApiUrl("/license-models"), { headers }).then((r) => r.json()),
      fetch(adminApiUrl(`/admin/products/${id}/variants`), { headers }).then((r) => r.json()),
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
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') : null
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        fetch(adminApiUrl(`/admin/products/${id}/variants/${v.id}/files`), { headers })
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
    const patchBody = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      category_id: formData.category_id === 0 ? null : formData.category_id,
      tag_ids: Array.isArray(formData.tag_ids) ? formData.tag_ids : [],
    }
    const token = localStorage.getItem('admin_auth_token')
    const r = await fetch(adminApiUrl(`/admin/products/${id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(patchBody),
    })
    if (r.ok) {
      const updated = await r.json()
      setProduct(updated)
      setEditMode(false)
    }
  }

  async function handleAddVariant() {
    if (!newVariantLicense) return
    const token = localStorage.getItem('admin_auth_token')
    const r = await fetch(adminApiUrl(`/admin/products/${id}/variants`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ license_model_id: newVariantLicense }),
    })
    if (r.ok) {
      const created = await r.json()
      setVariants((prev) => [...prev, created])
      setNewVariantLicense(0)
    }
  }

  async function handleUpdateVariant(variantId: number) {
    const token = localStorage.getItem('admin_auth_token')
    const r = await fetch(adminApiUrl(`/admin/products/${id}/variants/${variantId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(variantFormData),
    })
    if (r.ok) {
      const updated = await r.json()
      setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, ...updated } : v)))
      setEditingVariantId(null)
    }
  }

  async function handleDeleteVariant(variantId: number) {
    if (!confirm("Variante löschen?")) return
    const token = localStorage.getItem('admin_auth_token')
    const r = await fetch(adminApiUrl(`/admin/products/${id}/variants/${variantId}`), {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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

      const token = localStorage.getItem('admin_auth_token')
      // Use direct localhost URL like audio upload to bypass Next.js body size limits
      const backendUrl = typeof window !== 'undefined' ? 'http://localhost' : 'http://backend:9000';
      const r = await fetch(`${backendUrl}/custom/admin/products/${id}/variants/${variantId}/files?filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(file.type)}`, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    const token = localStorage.getItem('admin_auth_token')
    const r = await fetch(adminApiUrl(`/admin/products/${id}/variants/${variantId}/files/${fileId}`), {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (r.ok) {
      setVariantFiles((prev) => {
        const next = new Map(prev)
        const existing = next.get(variantId) || []
        next.set(variantId, existing.filter((f) => f.id !== fileId))
        return next
      })
    }
  }

  if (!product) return <div className="page-container">Lädt...</div>

  return (
    <div className="page-container">
      <button onClick={() => router.push("/products")} className="mb-20">
        ← Zurück
      </button>

      <h1>Produkt: {product.title}</h1>

      <div className="section-container">
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

      <h2 style={{ marginTop: 40, marginBottom: 16 }}>Varianten / Lizenzmodelle</h2>
      <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>Jede Variante repräsentiert ein Lizenzmodell mit eigenem Preis und Download-Dateien.</p>
      <div className="mb-30">
        {variants.length === 0 ? (
          <div className="empty-state">
            Keine Varianten vorhanden. Fügen Sie unten eine hinzu.
          </div>
        ) : (
          variants.map((v) => {
            const files = variantFiles.get(v.id) || []
            const isEditing = editingVariantId === v.id
            return (
              <div
                key={v.id}
                className="card"
                style={{
                  marginBottom: 20,
                  border: isEditing ? "2px solid var(--primary)" : undefined,
                  boxShadow: isEditing ? "0 4px 12px rgba(0,112,243,0.1)" : "none",
                }}
              >
                {isEditing ? (
                  <div>
                    <h3 style={{ marginBottom: 16 }}>Variante bearbeiten</h3>
                    <div className="mb-12">
                      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Name</label>
                      <input
                        type="text"
                        value={variantFormData.name}
                        onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="mb-12">
                      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Preis (Cent)</label>
                      <input
                        type="number"
                        value={variantFormData.price_cents}
                        onChange={(e) => setVariantFormData({ ...variantFormData, price_cents: Number(e.target.value) })}
                        style={{ width: "100%" }}
                      />
                      <small style={{ color: "#666" }}>Aktuell: {(variantFormData.price_cents / 100).toFixed(2)}€</small>
                    </div>
                    <div className="mb-12">
                      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Status</label>
                      <select
                        value={variantFormData.status}
                        onChange={(e) => setVariantFormData({ ...variantFormData, status: e.target.value })}
                        style={{ width: "100%" }}
                      >
                        <option value="active">Aktiv (verfügbar)</option>
                        <option value="inactive">Inaktiv (nicht verfügbar)</option>
                        <option value="sold_out">Ausverkauft</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Beschreibung / Lizenzbedingungen</label>
                      <textarea
                        value={variantFormData.description}
                        onChange={(e) => setVariantFormData({ ...variantFormData, description: e.target.value })}
                        placeholder="Details zur Lizenz, Nutzungsbedingungen, etc."
                        style={{ width: "100%", minHeight: 100 }}
                      />
                    </div>
                    <div className="flex gap-8">
                      <button onClick={() => handleUpdateVariant(v.id)}>
                        Speichern
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setEditingVariantId(null)}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <h3 style={{ margin: 0, fontSize: 18 }}>{v.name}</h3>
                          <span className={`badge badge-${v.status}`}>
                            {v.status === "active" ? "Aktiv" : v.status === "sold_out" ? "Ausverkauft" : "Inaktiv"}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: 14, marginBottom: 4 }}>
                          Lizenzmodell: <strong>{v.license_model_name}</strong> · Preis: <strong>{(v.price_cents / 100).toFixed(2)}€</strong>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <button
                          onClick={() => {
                            setEditingVariantId(v.id)
                            setVariantFormData({
                              name: v.name,
                              price_cents: v.price_cents,
                              status: v.status,
                              description: "",
                            })
                          }}
                        >
                          Bearbeiten
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteVariant(v.id)}
                        >
                          Löschen
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, padding: 16, background: "var(--input-bg)", borderRadius: 6 }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                        <strong style={{ fontSize: 15 }}>Download-Dateien ({files.length})</strong>
                        <button
                          className="btn-success"
                          onClick={() => handleUploadFile(v.id)}
                        >
                          + Datei hochladen
                        </button>
                      </div>
                      {files.length === 0 ? (
                        <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Keine Dateien angehängt. Laden Sie Dateien hoch, die Käufer herunterladen können.</p>
                      ) : (
                        <div className="flex-col gap-8">
                          {files.map((f) => (
                            <div
                              key={f.id}
                              className="card"
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: 10,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <a
                                  href={f.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontWeight: 600 }}
                                >
                                  {f.original_name}
                                </a>
                                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{(f.size / 1024).toFixed(1)} KB</div>
                              </div>
                              <button
                                className="btn-danger"
                                onClick={() => handleDeleteFile(v.id, f.id)}
                                style={{ padding: "4px 10px", fontSize: 13 }}
                              >
                                Löschen
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        <div style={{ marginTop: 20, padding: 20, background: "var(--card-bg)", border: "2px dashed var(--primary)", borderRadius: 8 }}>
          <h3 style={{ marginBottom: 12 }}>Neue Variante hinzufügen</h3>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 16 }}>Wählen Sie ein Lizenzmodell. Preis und Name werden als Vorlage übernommen und können anschließend angepasst werden.</p>
          <div className="flex gap-12 items-center">
            <select
              value={newVariantLicense}
              onChange={(e) => setNewVariantLicense(Number(e.target.value))}
              style={{ flex: 1, border: "1px solid var(--primary)" }}
            >
              <option value={0}>Lizenzmodell wählen ({licenseModels.length} verfügbar)</option>
              {licenseModels.map((lm) => (
                <option key={lm.id} value={lm.id}>
                  {lm.name} — {(lm.price_cents / 100).toFixed(2)}€{lm.description ? ` · ${lm.description}` : ""}
                </option>
              ))}
            </select>
            <button
              className="btn-success"
              onClick={handleAddVariant}
              disabled={!newVariantLicense}
            >
              + Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
