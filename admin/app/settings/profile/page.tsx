"use client"
import { useState, useEffect } from "react"

type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
  mfa_enabled: boolean
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("admin_auth_token")
    if (!token) {
      setLoading(false)
      return
    }

    fetch("/api/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          throw new Error(data?.message || "Fehler beim Laden")
        }
        setUser(data)
        setDisplayName(data.display_name || "")
        setAvatarUrl(data.avatar_url || "")
      })
      .catch((err) => setMessage(err?.message || "Fehler beim Laden"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    const token = localStorage.getItem("admin_auth_token")
    if (!token) return

    setSaving(true)
    setMessage("")

    try {
      const r = await fetch("/api/user/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl,
        }),
      })

      if (r.ok) {
        const updated = await r.json()
        setUser(updated)
        localStorage.setItem("admin_user", JSON.stringify(updated))
        setMessage("Gespeichert")
      } else {
        setMessage("Fehler beim Speichern")
      }
    } catch {
      setMessage("Netzwerkfehler")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 30 }}>Lädt...</div>
  if (!user) return <div style={{ padding: 30 }}>Nicht angemeldet</div>

  return (
    <div style={{ padding: 30, maxWidth: 600 }}>
      <h1>Benutzereinstellungen</h1>

      <div style={{ marginTop: 30, padding: 20, background: "#fafafa", borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>E-Mail</label>
          <input type="text" value={user.email} disabled style={{ width: "100%", padding: 8, background: "#eee" }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Anzeigename</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Max Mustermann"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Avatar URL</label>
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            style={{ width: "100%", padding: 8 }}
          />
          {avatarUrl && (
            <div style={{ marginTop: 8 }}>
              <img src={avatarUrl} alt="Avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>MFA Status</label>
          <span style={{ padding: "4px 12px", borderRadius: 4, background: user.mfa_enabled ? "#dfd" : "#fdd" }}>
            {user.mfa_enabled ? "Aktiviert" : "Deaktiviert"}
          </span>
        </div>

        {message && (
          <div style={{ marginBottom: 16, padding: 12, background: message.includes("Fehler") ? "#fee" : "#dfd", borderRadius: 8 }}>
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ padding: "10px 20px" }}>
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </div>
  )
}
