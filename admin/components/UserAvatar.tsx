"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
}

export default function UserAvatar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("admin_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
        return
      } catch {}
    }

    // If no stored user but we have a token, fetch the user from the backend
    const token = localStorage.getItem("admin_auth_token")
    if (token) {
      fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (r) => {
          if (!r.ok) return
          const data = await r.json()
          setUser(data)
          try { localStorage.setItem('admin_user', JSON.stringify(data)) } catch (e) {}
        })
        .catch(() => {})
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem("admin_auth_token")
    localStorage.removeItem("admin_user")
    router.push("/login")
  }

  if (!user) return null

  const initials = (user.display_name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "2px solid #ddd",
          background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : "#e0e0e0",
          color: "#333",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!user.avatar_url && initials}
      </button>

      {menuOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: 48,
              right: 0,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: 200,
              zIndex: 1000,
            }}
          >
            <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user.display_name || "User"}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
            </div>
            <Link
              href="/settings"
              style={{
                display: "block",
                padding: "10px 12px",
                fontSize: 14,
                color: "#333",
                textDecoration: "none",
                borderBottom: "1px solid #eee",
              }}
              onClick={() => setMenuOpen(false)}
            >
              Einstellungen
            </Link>
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
      )}
    </div>
  )
}
