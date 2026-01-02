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
    <div style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999
    }}>
      <div style={{
        background:"#fff",padding:32,borderRadius:12,minWidth:340,boxShadow:"0 8px 32px #aaa"
      }}>
        <h3>Lizenzmodell wählen</h3>
        <div style={{display:"flex",gap:22,margin:"22px 0"}}>
          {lizenzen.map((liz) => (
            <div
              key={liz.id}
              tabIndex={0}
              onClick={()=>setSelected(liz.id)}
              style={{
                border: selected===liz.id ? "2px solid #33b5e5" : "2px solid #ececec",
                background: selected===liz.id ? "#e6faff" : "#fafafa",
                borderRadius: 10, padding: "18px 24px", minWidth: 120, cursor:"pointer",
                boxShadow: selected===liz.id ? "0 0 10px #c3f1ff" : "0 1px 4px #efefef",
                outline: selected===liz.id ? "2px solid #33b5e5" : "none",
              }}
            >
              <div style={{fontWeight:600,fontSize:16,marginBottom:9}}>{liz.name}</div>
              <div style={{fontSize:13,color:"#555"}}>{liz.description}</div>
              <div style={{marginTop:10,color:"#1994e2",fontWeight:500,fontSize:15}}>{formatPriceCents(liz.price_cents)} €</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:24,display:"flex",gap:18}}>
          <button disabled={!selected} onClick={() => { if (selected !== undefined) onSelect(selected) }}>Bestätigen</button>
          <button onClick={onClose} style={{background:"#eee"}}>Abbrechen</button>
        </div>
      </div>
    </div>
  )
}