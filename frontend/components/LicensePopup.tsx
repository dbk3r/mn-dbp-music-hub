import React, { useState } from "react"

type LicenseModel = {
  id: string | number
  name: string
  description?: string | null
  price_cents?: number | null
}

type LicensePopupProps = {
  lizenzen: LicenseModel[]
  onSelect: (id: string | number) => void
  onClose: () => void
}

export default function LicensePopup({ lizenzen, onSelect, onClose }: LicensePopupProps) {
  const [selected, setSelected] = useState<string | number | undefined>(lizenzen[0]?.id)

  function formatPriceCents(v: number | null | undefined) {
    if (typeof v !== "number" || !Number.isFinite(v)) return "–"
    return (v / 100).toFixed(2)
  }

  return (
    <div className="license-popup-overlay" onClick={(e) => { e.stopPropagation(); onClose() }}>
      <div className="license-popup" onClick={(e) => e.stopPropagation()}>
        <h3>Lizenzmodell wählen</h3>
        <div className="license-options">
          {lizenzen.map((liz) => (
            <div
              key={liz.id}
              tabIndex={0}
              onClick={() => setSelected(liz.id)}
              className={"license-option" + (selected === liz.id ? " selected" : "")}
            >
              <div className="license-title">{liz.name}</div>
              <div className="license-desc">{liz.description}</div>
              <div className="license-price">{formatPriceCents(liz.price_cents)} €</div>
            </div>
          ))}
        </div>
        <div className="license-popup-actions">
          <button
            disabled={!selected}
            onClick={(e) => {
              e.stopPropagation()
              if (selected !== undefined) onSelect(selected)
            }}
          >
            Bestätigen
          </button>
          <button
            
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}