"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import HeaderMenu from "../components/HeaderMenu"
import Avatar from "../components/Avatar"

type User = {
  id: number | string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  address: {
    id: string
    address_1: string | null
    address_2: string | null
    city: string | null
    postal_code: string | null
    country_code: string
    province: string | null
  } | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [countryCode, setCountryCode] = useState("DE")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem("user_token")
    if (!token) {
      router.push("/login")
      return
    }

    fetch("/custom/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUser(data)
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setPhone(data.phone || "")
        setAddress1(data.address?.address_1 || "")
        setAddress2(data.address?.address_2 || "")
        setCity(data.address?.city || "")
        setPostalCode(data.address?.postal_code || "")
        setCountryCode(data.address?.country_code || "DE")
      })
      .catch(() => setError("Profil konnte nicht geladen werden"))
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const token = localStorage.getItem("user_token")
      const r = await fetch("/custom/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          address: {
            address_1: address1,
            address_2: address2,
            city: city,
            postal_code: postalCode,
            country_code: countryCode
          }
        }),
      })

      if (!r.ok) {
        const data = await r.json()
        setError(data.message || "Speichern fehlgeschlagen")
        return
      }

      const updated = await r.json()
      setUser(updated)
      setSuccess(true)
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const token = localStorage.getItem("user_token")
    if (!token) return

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const r = await fetch("/custom/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (r.ok) {
        const data = await r.json()
        setUser((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await r.json()
        setError(data.message || "Upload fehlgeschlagen")
      }
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setUploading(false)
    }
  }

  async function handleAvatarDelete() {
    const token = localStorage.getItem("user_token")
    if (!token) return

    setUploading(true)
    setError("")

    try {
      const r = await fetch("/custom/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (r.ok) {
        setUser((prev) => prev ? { ...prev, avatar_url: null } : null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError("Löschen fehlgeschlagen")
      }
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setUploading(false)
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
          <label style={{ display: "block", marginBottom: 12, fontWeight: 600, color: "#666" }}>Avatar</label>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Avatar
              src={user.avatar_url}
              firstName={user.first_name}
              lastName={user.last_name}
              size={80}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: "8px 16px",
                  background: uploading ? "#9ca3af" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Lädt..." : "Bild hochladen"}
              </button>
              {user.avatar_url && (
                <button
                  type="button"
                  onClick={handleAvatarDelete}
                  disabled={uploading}
                  style={{
                    padding: "8px 16px",
                    background: uploading ? "#9ca3af" : "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: uploading ? "not-allowed" : "pointer",
                  }}
                >
                  Löschen
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
            />
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Max. 5MB, JPEG/PNG/GIF/WEBP
          </p>
        </div>

        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, color: "#666" }}>E-Mail</label>
          <div style={{ padding: 10, background: "#f9f9f9", borderRadius: 8, color: "#333" }}>{user.email}</div>
        </div>

        {error && <div style={{ marginBottom: 16, padding: 12, background: "#fee", color: "#d00", borderRadius: 8 }}>{error}</div>}
        {success && <div style={{ marginBottom: 16, padding: 12, background: "#efe", color: "#070", borderRadius: 8 }}>Gespeichert!</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Vorname</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Nachname</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
          </div>

          <h3 style={{ marginTop: 30, marginBottom: 16 }}>Adresse</h3>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Straße und Hausnummer</label>
            <input
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Adresszusatz (optional)</label>
            <input
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>PLZ</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Ort</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Land</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
            >
              <option value="DE">Deutschland</option>
              <option value="AT">Österreich</option>
              <option value="CH">Schweiz</option>
              <option value="US">USA</option>
              <option value="GB">Vereinigtes Königreich</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: loading ? "#999" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Speichert..." : "Speichern"}
          </button>
        </form>
      </div>
    </>
  )
}

