"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"

type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
}

type UserMenuProps = {
  onClose: () => void
}

export default function UserMenu({ onClose }: UserMenuProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user_data")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {}
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem("user_token")
    localStorage.removeItem("user_data")
    router.push("/login")
    onClose()
  }

  if (!user) return null

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: 60,
          right: 20,
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          minWidth: 200,
          zIndex: 9999,
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user.display_name || "User"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
        </div>
        <button
          onClick={() => {
            router.push("/settings")
            onClose()
          }}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            fontSize: 14,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
          }}
        >
          Einstellungen
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            fontSize: 14,
            background: "transparent",
            border: "none",
            color: "#d00",
            cursor: "pointer",
          }}
        >
          Abmelden
        </button>
      </div>
    </>
  )
}
