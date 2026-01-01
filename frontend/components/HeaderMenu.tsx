import React, { useEffect, useState } from "react"
export default function HeaderMenu({right}) {
  const [menu, setMenu] = useState([])
  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.json())
      .then(data => setMenu(data.items || []))
  }, [])
  return (
    <header style={{position:"sticky",top:0,zIndex:1000,background:"#fff",padding:"0.5em 1em",boxShadow:"0 2px 8px #eee",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <nav>
        <ul style={{listStyle:"none",display:"flex",gap:"2em",margin:0,padding:0}}>
          {menu.map((item,i) => (
            <li key={i}><a href={item.link}>{item.label}</a></li>
          ))}
        </ul>
      </nav>
      {right}
    </header>
  )
}