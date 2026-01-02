import React, { useState } from "react"
import LicensePopup from "./LicensePopup"

type AudioSearchItem = {
  id: number
  title: string
  artist: string | null
  release_year: number | null
  duration_ms: number | null
  category?: string | null
  tags?: string[]
  license_models: Array<{
    id: number
    name: string
    description: string | null
    price_cents: number
  }>
}

type AudioSearchResultCardProps = {
  item: AudioSearchItem
  onSelect: () => void
  onAddToCart: (payload: { audioId: number; licenseModelId: number }) => void
}

function formatMs(ms: number | null | undefined) {
  if (!ms || ms <= 0) return "–"
  const totalSeconds = Math.round(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = String(totalSeconds % 60).padStart(2, "0")
  return `${m}:${s}`
}

export default function AudioSearchResultCard({ item, onSelect, onAddToCart }: AudioSearchResultCardProps) {
  const [popupOpen, setPopupOpen] = useState(false)
  const artist = item.artist?.trim() ? item.artist : "Unbekannter Künstler"
  const year = item.release_year ? String(item.release_year) : "–"
  const dur = formatMs(item.duration_ms)
  const metaParts = [item.category, ...(Array.isArray(item.tags) ? item.tags : [])].filter(Boolean)

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #eee",
        margin: "1em 0",
        padding: 16,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
        <div style={{ color: "#666" }}>{artist}</div>
        <div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>Jahr: {year} · Länge: {dur}</div>
        {metaParts.length ? (
          <div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>{metaParts.join(" · ")}</div>
        ) : null}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setPopupOpen(true)
        }}
        title="In den Warenkorb"
        style={{
          marginLeft: 12,
          border: "1px solid #eee",
          background: "#fafafa",
          borderRadius: 8,
          padding: "10px 12px",
          cursor: "pointer",
        }}
      >
        🛒
      </button>

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginLeft: 12,
          border: "1px solid #eee",
          background: "#fafafa",
          borderRadius: 8,
          padding: "10px 12px",
          cursor: "pointer",
          fontWeight: 700,
        }}
        title="Abspielen"
      >
        ▶
      </button>

      {popupOpen && (
        <LicensePopup
          lizenzen={item.license_models}
          onSelect={(lizenzId) => {
            setPopupOpen(false)
            onAddToCart({ audioId: item.id, licenseModelId: Number(lizenzId) })
          }}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  )
}
