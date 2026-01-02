"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import HeaderMenu from "../components/HeaderMenu"

type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
  mfa_enabled: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("user_token")
    if (!token) {
      router.push("/login")
      return
    }

    fetch("/api/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUser(data)
        setDisplayName(data.display_name || "")
        setAvatarUrl(data.avatar_url || "")
      })
      .catch(() => setError("Benutzer konnte nicht geladen werden"))
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const token = localStorage.getItem("user_token")
      const r = await fetch("/api/user/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
      })

      if (!r.ok) {
        const data = await r.json()
        setError(data.message || "Speichern fehlgeschlagen")
        return
      }

      const updated = await r.json()
      setUser(updated)
      localStorage.setItem("user_data", JSON.stringify(updated))
      setSuccess(true)
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <>
        <HeaderMenu right={null} />
        <div style={{ padding: 30 }}>Lädt...</div>
      </>
    )
  }

  return (
    <>
      <HeaderMenu />
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 30, background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <h1 style={{ marginBottom: 30 }}>Einstellungen</h1>
        
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, color: "#666" }}>E-Mail</label>
          <div style={{ padding: 10, background: "#f9f9f9", borderRadius: 8, color: "#333" }}>{user.email}</div>
        </div>

        {error && <div style={{ marginBottom: 16, padding: 12, background: "#fee", color: "#d00", borderRadius: 8 }}>{error}</div>}
        {success && <div style={{ marginBottom: 16, padding: 12, background: "#efe", color: "#070", borderRadius: 8 }}>Gespeichert!</div>}

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Anzeigename</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Max Mustermann"
              style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Avatar URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
            />
            {avatarUrl && (
              <div style={{ marginTop: 10 }}>
                <img src={avatarUrl} alt="Avatar Vorschau" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>MFA Status</label>
            <div style={{ padding: 10, background: user.mfa_enabled ? "#efe" : "#fee", color: user.mfa_enabled ? "#070" : "#d00", borderRadius: 8, fontWeight: 600 }}>
              {user.mfa_enabled ? "Aktiviert" : "Deaktiviert"}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, fontSize: 16, fontWeight: 600 }}>
            {loading ? "Speichert..." : "Speichern"}
          </button>
        </form>
      </div>
    </>
  )
}
