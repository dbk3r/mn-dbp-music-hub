import React, { useState, useEffect } from "react"

type SearchBarProps = {
  onSearch: (values: any) => void
}

const initialFields = {
  title: "",
  artist: "",
  category: "",
  tag: "",
  priceMin: "",
  priceMax: "",
  licenseModel: "",
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [values, setValues] = useState(initialFields)
  const [collapsed, setCollapsed] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [licenseModels, setLicenseModels] = useState<string[]>([])

  // Kategorien, Tags und Lizenzmodelle vom Backend laden
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(()=>setCategories([]))

    fetch("/api/tags")
      .then(r => r.json())
      .then(data => setTags(Array.isArray(data) ? data : []))
      .catch(()=>setTags([]))

    fetch("/api/license-models")
      .then(r => r.json())
      .then(data => setLicenseModels(Array.isArray(data) ? data : []))
      .catch(()=>setLicenseModels([]))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSearch(values)
  }

  return (
    <div style={{position:"sticky",top:"3.5em",zIndex:999,background:"#fafafa",boxShadow:"0 2px 8px #eee",padding:"1em"}}>
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
            {licenseModels.map(lm => <option key={lm} value={lm}>{lm}</option>)}
          </select>
          <button type="submit">Suchen</button>
        </form>
      )}
    </div>
  )
}