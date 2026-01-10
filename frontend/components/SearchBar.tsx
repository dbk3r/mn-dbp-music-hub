import React, { useState, useEffect } from "react"

export type SearchValues = {
  title: string
  artist: string
  category: string
  tag: string
  priceMin: string
  priceMax: string
  licenseModel: string
}

export type SearchBarProps = {
  onSearch: (values: SearchValues) => void
}

type LicenseModelItem = {
  id: number
  name: string
  description: string | null
  price_cents: number
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

const initialFields: SearchValues = {
  title: "",
  artist: "",
  category: "",
  tag: "",
  priceMin: "",
  priceMax: "",
  licenseModel: "",
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [values, setValues] = useState<SearchValues>(initialFields)
  const [collapsed, setCollapsed] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [licenseModels, setLicenseModels] = useState<LicenseModelItem[]>([])
  // Kategorien, Tags und Lizenzmodelle vom Backend laden
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

    fetch(`${backendUrl}/custom/categories`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(()=>setCategories([]))

    fetch(`${backendUrl}/custom/tags`, { cache: "no-store" })
      .then(r => r.json())
      .then(data => setTags(Array.isArray(data) ? data : []))
      .catch(()=>setTags([]))

    fetch(`${backendUrl}/custom/license-models`, { cache: "no-store" })
      .then(r => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setLicenseModels([])
          return
        }

        // Backward compatible: accept string[] or object[]
        const normalized: LicenseModelItem[] = data
          .map((x: unknown) => {
            if (typeof x === "string") {
              return { id: Number.NaN, name: x, description: null, price_cents: 0 }
            }
            if (!isRecord(x)) {
              return { id: Number.NaN, name: "", description: null, price_cents: 0 }
            }
            const id = Number(x.id)
            const name = typeof x.name === "string" ? x.name : String(x.name ?? "")
            const description = x.description == null ? null : String(x.description)
            const price_cents = Number(x.price_cents ?? 0)
            return { id, name, description, price_cents }
          })
          .filter((x) => x.name)

        setLicenseModels(normalized)
      })
      .catch(() => setLicenseModels([]))
  }, [])

  function fmtCents(v: number) {
    if (!Number.isFinite(v)) return "–"
    return (v / 100).toFixed(2)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(values)
  }

  return (
    <div className="app-search">
      <button style={{float:"right"}} onClick={() => setCollapsed(c => !c)}>
        {collapsed ? "Suche öffnen" : "Suche schließen"}
      </button>
      {!collapsed && (
        <form onSubmit={handleSubmit} style={{display:"flex",gap:"1em",alignItems:"center",flexWrap: "wrap"}}>
          <input
            type="text"
            name="title"
            value={values.title}
            placeholder="Titel"
            onChange={handleChange}
            style={{minWidth: 120}}
          />
          <input
            type="text"
            name="artist"
            value={values.artist}
            placeholder="Künstler"
            onChange={handleChange}
            style={{minWidth: 120}}
          />
          <select
            name="category"
            value={values.category}
            onChange={handleChange}
            style={{minWidth: 140}}
          >
            <option value="">Kategorie</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            name="tag"
            value={values.tag}
            onChange={handleChange}
            style={{minWidth: 140}}
          >
            <option value="">Tag</option>
            {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <input
            type="number"
            name="priceMin"
            value={values.priceMin}
            placeholder="Min. Preis"
            onChange={handleChange}
            style={{width: 100}}
          />
          <input
            type="number"
            name="priceMax"
            value={values.priceMax}
            placeholder="Max. Preis"
            onChange={handleChange}
            style={{width: 100}}
          />
          <select
            name="licenseModel"
            value={values.licenseModel}
            onChange={handleChange}
            style={{minWidth: 150}}
          >
            <option value="">Lizenzmodell</option>
            {licenseModels.map((lm) => (
              <option key={`${lm.id}-${lm.name}`} value={Number.isFinite(lm.id) ? String(lm.id) : lm.name}>
                {lm.name} ({fmtCents(lm.price_cents)}€)
              </option>
            ))}
          </select>
          <button type="submit">Suchen</button>
        </form>
      )}
    </div>
  )
}