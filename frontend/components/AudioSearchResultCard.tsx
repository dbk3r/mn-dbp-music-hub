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
  const [isHovered, setIsHovered] = useState(false)
  const artist = item.artist?.trim() ? item.artist : "Unbekannter Künstler"
  const year = item.release_year ? String(item.release_year) : "–"
  const dur = formatMs(item.duration_ms)
  const metaParts = [item.category, ...(Array.isArray(item.tags) ? item.tags : [])].filter(Boolean)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: isHovered ? "var(--card-hover, #252525)" : "var(--card-bg, #1a1a1a)",
        borderRadius: 8,
        border: isHovered ? "1px solid var(--primary, #0070f3)" : "1px solid var(--card-border, #2a2a2a)",
        margin: "1em 0",
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: isHovered ? "0 4px 12px rgba(0, 112, 243, 0.15)" : "none",
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--foreground, #ededed)" }}>
          {item.title}
        </div>
        <div style={{ color: "var(--text-muted, #888)", marginTop: 4 }}>{artist}</div>
        <div style={{ color: "var(--text-muted, #888)", fontSize: 13, marginTop: 6 }}>Jahr: {year} · Länge: {dur}</div>
        {metaParts.length ? (
          <div style={{ color: "var(--text-muted, #888)", fontSize: 13, marginTop: 4 }}>{metaParts.join(" · ")}</div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setPopupOpen(true)
        }}
        title="In den Warenkorb"
        className="btn-success"
        style={{
          marginLeft: 16,
          padding: "12px 20px",
          fontSize: 16,
        }}
      >
        🛒 In den Warenkorb
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
