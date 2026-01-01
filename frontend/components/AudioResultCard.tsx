import React, { useState } from "react"
import LicensePopup from "./LicensePopup"
export default function AudioResultCard({ item, onAddToCart }) {
  const [popupOpen, setPopupOpen] = useState(false)
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "#fff", borderRadius: 8, boxShadow: "0 2px 10px #eee",
      margin: "1em 0", padding: 16, position: "relative"
    }}>
      <img src={item.coverUrl} alt="cover" style={{width:80, height:80, borderRadius:8, objectFit:"cover", marginRight:20}} />
      <div style={{flex:1}}>
        <div style={{fontWeight:600, fontSize: 18}}>{item.title}</div>
        <div>{item.artist}</div>
        <div style={{color:"#999", fontSize:14}}>{item.category} – {item.tags?.join(", ")}</div>
        <div style={{fontSize:13, marginTop:4}}>Länge: {item.length}s</div>
      </div>
      <button style={{marginLeft:16, padding:"10px 18px", fontWeight:600}} onClick={() => setPopupOpen(true)}>Warenkorb +</button>
      {popupOpen && (
        <LicensePopup lizenzen={item.licenseModels} onSelect={lizenzId => {setPopupOpen(false);onAddToCart({...item, licenseModel: lizenzId})}} onClose={() => setPopupOpen(false)} />
      )}
    </div>
  )
}