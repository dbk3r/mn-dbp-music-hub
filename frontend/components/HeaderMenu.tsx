"use client"
import React, { useEffect, useState } from "react"
import UserAvatar from "./UserAvatar"
import UserMenu from "./UserMenu"

type HeaderMenuProps = {
  right?: React.ReactNode | null
}

type MenuItem = {
  label: string
  link: string
}

export default function HeaderMenu({ right }: HeaderMenuProps) {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.json())
      .then((data: { items?: MenuItem[] }) => setMenu(Array.isArray(data.items) ? data.items : []))
  }, [])
  
  return (
    <header className="app-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <nav>
        <ul style={{listStyle:"none",display:"flex",gap:"2em",margin:0,padding:0}}>
          {[
            { label: "Start", link: "/" },
            ...menu,
          ].map((item, i) => (
            <li key={i}><a href={item.link}>{item.label}</a></li>
          ))}
        </ul>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {right}
        <UserAvatar onClick={() => setShowUserMenu(!showUserMenu)} />
        {showUserMenu && <UserMenu onClose={() => setShowUserMenu(false)} />}
      </div>
    </header>
  )
}