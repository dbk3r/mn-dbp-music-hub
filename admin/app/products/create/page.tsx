"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { adminApiUrl } from "../../_lib/api"

type Option = { id: number; name: string }
type AudioItem = { id: number; title: string; artist: string | null }

export default function ProductCreatePage() {
  const router = useRouter()

  const [audioItems, setAudioItems] = useState<AudioItem[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [tags, setTags] = useState<Option[]>([])
  const [licenses, setLicenses] = useState<Option[]>([])

  const [audioId, setAudioId] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("draft")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [tagIds, setTagIds] = useState<number[]>([])
  const [variants, setVariants] = useState<
    Array<{
      licenseModelId: number
      licenseModelName: string
      name: string
      priceCents: number
      status: string
      description: string
      files: File[]
    }>
  >([])

  const [showLicenseSelector, setShowLicenseSelector] = useState(false)
  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("admin_auth_token")
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    Promise.all([
      fetch(adminApiUrl("/audio"), { headers }).then((r) => r.json()),
      fetch(adminApiUrl("/categories"), { headers }).then((r) => r.json()),
      fetch(adminApiUrl("/tags"), { headers }).then((r) => r.json()),
      fetch(adminApiUrl("/license-models"), { headers }).then((r) => r.json()),
    ])
      .then(([a, c, t, l]) => {
        setAudioItems(Array.isArray(a.items) ? a.items.map((x: any) => ({ id: x.id, title: x.title, artist: x.artist })) : [])
        setCategories(Array.isArray(c.items) ? c.items : [])
        setTags(Array.isArray(t.items) ? t.items : [])
        setLicenses(Array.isArray(l.items) ? l.items.map((x: any) => ({ id: x.id, name: x.name })) : [])
      })
      .catch((err) => setError("Optionen laden fehlgeschlagen: " + err.message))
  }, [])

  function handleAddVariant() {
    if (!selectedLicenseId) return
    const license = licenses.find((l) => l.id === selectedLicenseId)
    if (!license) return

    const alreadyAdded = variants.some((v) => v.licenseModelId === selectedLicenseId)
    if (alreadyAdded) {
      setError("Dieses Lizenzmodell wurde bereits hinzugefügt")
      return
    }

    setVariants((prev) => [
      ...prev,
      {
        licenseModelId: license.id,
        licenseModelName: license.name,
        name: license.name,
        priceCents: typeof license.price_cents === "number" ? license.price_cents : 0,
        status: "active",
        description: license.description || "",
        files: [],
      },
    ])
    setSelectedLicenseId(null)
    setShowLicenseSelector(false)
    setError(null)
  }

  function handleRemoveVariant(licenseModelId: number) {
    setVariants((prev) => prev.filter((v) => v.licenseModelId !== licenseModelId))
  }

  function handleUpdateVariant(licenseModelId: number, updates: Partial<typeof variants[0]>) {
    setVariants((prev) =>
      prev.map((v) => (v.licenseModelId === licenseModelId ? { ...v, ...updates } : v))
    )
  }

  function handleVariantFilesChange(licenseModelId: number, files: FileList | null) {
    if (!files) return
    const fileArray = Array.from(files)
    setVariants((prev) =>
      prev.map((v) =>
        v.licenseModelId === licenseModelId ? { ...v, files: [...v.files, ...fileArray] } : v
      )
    )
  }

  function handleRemoveVariantFile(licenseModelId: number, fileIndex: number) {
    setVariants((prev) =>
      prev.map((v) =>
        v.licenseModelId === licenseModelId
          ? { ...v, files: v.files.filter((_, i) => i !== fileIndex) }
          : v
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!audioId) {
      setError("Audio-Datei auswählen")
      return
    }

    setBusy(true)
    setError(null)

    const token = localStorage.getItem("admin_auth_token")
    const headers = token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" }

    const res = await fetch(adminApiUrl("/products"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        audio_file_id: audioId,
        title: title || undefined,
        description: description || undefined,
        status,
        category_id: categoryId,
        tag_ids: tagIds,
        variants: variants.map((v) => ({
          license_model_id: v.licenseModelId,
          name: v.name,
          price_cents: v.priceCents,
          status: v.status,
          description: v.description,
        })),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.message || `Fehler (${res.status})`)
      setBusy(false)
      return
    }

    const created = await res.json().catch(() => null)
    const productId = created?.id
    const createdVariants = created?.variants || []

    // Upload files for each variant
    if (productId && createdVariants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const variantData = variants[i]
        const createdVariant = createdVariants[i]
        if (createdVariant && variantData.files.length > 0) {
          for (const file of variantData.files) {
            const uploadRes = await fetch(
              adminApiUrl(`/products/${productId}/variants/${createdVariant.id}/files?filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(file.type)}`),
              {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: file,
              }
            ).catch(() => null)
            if (!uploadRes || !uploadRes.ok) {
              console.warn(`File upload failed for ${file.name}`)
            }
          }
        }
      }
    }

    setBusy(false)
    if (productId) {
      router.push(`/products/${productId}`)
    } else {
      router.push("/products")
    }
  }

  const canSubmit = useMemo(
    () => Boolean(audioId && status && variants.length > 0),
    [audioId, status, variants.length]
  )

  return (
    <div style={{ padding: 30, maxWidth: 720 }}>
      <button onClick={() => router.push("/products")} style={{ marginBottom: 16, padding: "8px 12px", cursor: "pointer" }}>
        ← Zurück
      </button>

      <h1 style={{ marginBottom: 12 }}>Neues Produkt</h1>
      <p className="text-muted" style={{ marginBottom: 20 }}>Erzeuge ein Produkt für eine hochgeladene Audio-Datei.</p>

      {error && (
        <div className="error-message" style={{ marginBottom: 16, padding: 12, borderRadius: 8 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Audio-Datei *</label>
          <select
            value={audioId ?? ""}
            onChange={(e) => setAudioId(e.target.value ? Number(e.target.value) : null)}
            style={{ width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
            required
          >
            <option value="">Bitte wählen… ({audioItems.length} verfügbar)</option>
            {audioItems.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} – {a.title}{a.artist ? ` (${a.artist})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Titel (optional)</label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Überschreibt Audio-Titel"
            style={{ width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }} 
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Beschreibung (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Produktbeschreibung"
            style={{ width: "100%", minHeight: 100, padding: 10, fontSize: 14 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            style={{ width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="draft">Entwurf (draft)</option>
            <option value="published">Veröffentlicht (published)</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Kategorie (optional)</label>
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            style={{ width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="">(keine – {categories.length} verfügbar)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Tags ({tags.length} verfügbar, {tagIds.length} ausgewählt)</label>
          {tags.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 14 }}>Keine Tags verfügbar</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12, border: "1px solid #eee", borderRadius: 4, background: "#fafafa" }}>
              {tags.map((t) => {
                const checked = tagIds.includes(t.id)
                return (
                  <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer", padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, background: checked ? "#e0f0ff" : "#fff" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setTagIds((prev) =>
                          e.target.checked ? Array.from(new Set([...prev, t.id])) : prev.filter((id) => id !== t.id)
                        )
                      }}
                      style={{ cursor: "pointer" }}
                    />
                    {t.name}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Varianten ({variants.length} hinzugefügt)
          </label>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Fügen Sie Varianten basierend auf Lizenzmodellen hinzu. Jede Variante kann eigene Dateien enthalten.
          </p>

          {variants.length === 0 ? (
            <div
              style={{
                padding: 20,
                background: "#2a2a2a",
                border: "2px dashed #555",
                borderRadius: 8,
                textAlign: "center",
                color: "#888",
                marginBottom: 12,
              }}
            >
              Noch keine Varianten hinzugefügt. Klicken Sie unten auf "+ Variante hinzufügen".
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 12 }}>
              {variants.map((variant) => (
                <div
                  key={variant.licenseModelId}
                  style={{
                    padding: 16,
                    border: "1px solid #444",
                    borderRadius: 8,
                    background: "#2a2a2a",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                      {variant.licenseModelName}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(variant.licenseModelId)}
                      style={{
                        padding: "6px 12px",
                        background: "#d00",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Entfernen
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleUpdateVariant(variant.licenseModelId, { name: e.target.value })}
                        style={{ width: "100%", padding: 8, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        Preis (Cent)
                      </label>
                      <input
                        type="number"
                        value={variant.priceCents}
                        onChange={(e) =>
                          handleUpdateVariant(variant.licenseModelId, { priceCents: Number(e.target.value) })
                        }
                        style={{ width: "100%", padding: 8, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
                      />
                      <small className="text-muted">= {(variant.priceCents / 100).toFixed(2)}€</small>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Status</label>
                    <select
                      value={variant.status}
                      onChange={(e) => handleUpdateVariant(variant.licenseModelId, { status: e.target.value })}
                      style={{ width: "100%", padding: 8, fontSize: 14, borderRadius: 4, border: "1px solid #ccc" }}
                    >
                      <option value="active">Aktiv (verfügbar)</option>
                      <option value="inactive">Inaktiv (nicht verfügbar)</option>
                      <option value="sold_out">Ausverkauft</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Beschreibung / Lizenzbedingungen
                    </label>
                    <textarea
                      value={variant.description}
                      onChange={(e) => handleUpdateVariant(variant.licenseModelId, { description: e.target.value })}
                      placeholder="Details zur Lizenz, Nutzungsbedingungen, etc."
                      style={{
                        width: "100%",
                        minHeight: 80,
                        padding: 8,
                        fontSize: 14,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>

                  <div style={{ padding: 12, background: "#1a1a1a", borderRadius: 6, border: '1px solid #444' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong style={{ fontSize: 14 }}>Download-Dateien ({variant.files.length})</strong>
                      <label
                        style={{
                          padding: "6px 12px",
                          background: "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        + Dateien hinzufügen
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleVariantFilesChange(variant.licenseModelId, e.target.files)}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                    {variant.files.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>Keine Dateien hinzugefügt</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {variant.files.map((file, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: 8,
                              background: "#2a2a2a",
                              border: "1px solid #555",
                              borderRadius: 4,
                              fontSize: 13,
                              color: '#e0e0e0'
                            }}
                          >
                            <div>
                              <strong>{file.name}</strong>
                              <div className="text-muted" style={{ fontSize: 12 }}>{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantFile(variant.licenseModelId, index)}
                              style={{
                                padding: "4px 8px",
                                background: "#d00",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              Entfernen
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showLicenseSelector ? (
            <div
              style={{
                padding: 16,
                background: "#1a2530",
                border: "2px solid #0070f3",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>Lizenzmodell auswählen</h4>
              <select
                value={selectedLicenseId || ""}
                onChange={(e) => setSelectedLicenseId(e.target.value ? Number(e.target.value) : null)}
                style={{ width: "100%", padding: 10, fontSize: 14, borderRadius: 4, border: "1px solid #0070f3", marginBottom: 12 }}
              >
                <option value="">Bitte wählen... ({licenses.filter((l) => !variants.some((v) => v.licenseModelId === l.id)).length} verfügbar)</option>
                {licenses
                  .filter((l) => !variants.some((v) => v.licenseModelId === l.id))
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {typeof l.price_cents === "number" ? (l.price_cents / 100).toFixed(2) : "0.00"}€
                      {l.description ? ` · ${l.description}` : ""}
                    </option>
                  ))}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={!selectedLicenseId}
                  style={{
                    padding: "10px 16px",
                    background: selectedLicenseId ? "#0070f3" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: selectedLicenseId ? "pointer" : "not-allowed",
                    fontWeight: 600,
                  }}
                >
                  Hinzufügen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLicenseSelector(false)
                    setSelectedLicenseId(null)
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "#eee",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLicenseSelector(true)}
              disabled={licenses.length === 0 || variants.length >= licenses.length}
              style={{
                padding: "10px 16px",
                background: licenses.length === 0 || variants.length >= licenses.length ? "#ccc" : "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: licenses.length === 0 || variants.length >= licenses.length ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              + Variante hinzufügen
            </button>
          )}
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #ddd" }}>
          <button 
            type="submit" 
            disabled={!canSubmit || busy} 
            style={{ 
              padding: "12px 24px", 
              fontSize: 15, 
              fontWeight: 600,
              borderRadius: 6,
              border: "none",
              background: (!canSubmit || busy) ? "#ccc" : "#0070f3",
              color: "#fff",
              cursor: (!canSubmit || busy) ? "not-allowed" : "pointer"
            }}
          >
            {busy ? "Speichert…" : "Produkt anlegen"}
          </button>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>* Pflichtfelder: Audio-Datei, mindestens eine Variante</p>
        </div>
      </form>
    </div>
  )
}
