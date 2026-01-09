"use client"
import { useState, useEffect, useRef } from "react"
import Avatar from "../../../components/Avatar"

type AdminProfile = {
  id: number
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  postal_code: string | null
  country_code: string | null
  avatar_url: string | null
  iban: string | null
  bic: string | null
  bank_account_holder: string | null
  paypal_email: string | null
  tax_number: string | null
  vat_id: string | null
  roles: string[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [countryCode, setCountryCode] = useState("DE")
  const [iban, setIban] = useState("")
  const [bic, setBic] = useState("")
  const [bankAccountHolder, setBankAccountHolder] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [taxNumber, setTaxNumber] = useState("")
  const [vatId, setVatId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem("admin_auth_token")
    if (!token) {
      setLoading(false)
      return
    }

    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          throw new Error(data?.message || "Fehler beim Laden")
        }
        setProfile(data)
        setDisplayName(data.display_name || "")
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setPhone(data.phone || "")
        setAddress1(data.address_1 || "")
        setAddress2(data.address_2 || "")
        setCity(data.city || "")
        setPostalCode(data.postal_code || "")
        setCountryCode(data.country_code || "DE")
        setIban(data.iban || "")
        setBic(data.bic || "")
        setBankAccountHolder(data.bank_account_holder || "")
        setPaypalEmail(data.paypal_email || "")
        setTaxNumber(data.tax_number || "")
        setVatId(data.vat_id || "")
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
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          address_1: address1,
          address_2: address2,
          city: city,
          postal_code: postalCode,
          country_code: countryCode,
          iban: iban,
          bic: bic,
          bank_account_holder: bankAccountHolder,
          paypal_email: paypalEmail,
          tax_number: taxNumber,
          vat_id: vatId
        }),
      })

      if (r.ok) {
        const updated = await r.json()
        setProfile(updated)
        setMessage("Gespeichert")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Fehler beim Speichern")
      }
    } catch {
      setMessage("Netzwerkfehler")
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const token = localStorage.getItem("admin_auth_token")
    if (!token) return

    setUploading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const r = await fetch("/api/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (r.ok) {
        const data = await r.json()
        setProfile((prev) => prev ? { ...prev, avatar_url: data.avatar_url } : null)
        setMessage("Avatar hochgeladen")
        setTimeout(() => setMessage(""), 3000)
      } else {
        const data = await r.json()
        setMessage(data.message || "Upload fehlgeschlagen")
      }
    } catch {
      setMessage("Netzwerkfehler")
    } finally {
      setUploading(false)
    }
  }

  async function handleAvatarDelete() {
    const token = localStorage.getItem("admin_auth_token")
    if (!token) return

    setUploading(true)
    setMessage("")

    try {
      const r = await fetch("/api/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (r.ok) {
        setProfile((prev) => prev ? { ...prev, avatar_url: null } : null)
        setMessage("Avatar gelöscht")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Löschen fehlgeschlagen")
      }
    } catch {
      setMessage("Netzwerkfehler")
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div style={{ padding: 30 }}>Lädt...</div>
  if (!profile) return <div style={{ padding: 30 }}>Nicht angemeldet</div>

  return (
    <div style={{ padding: 30, maxWidth: 600 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Mein Profil</h1>
      <p style={{ color: "#6b7280", marginBottom: 30 }}>
        Verwalte deine persönlichen Einstellungen
      </p>

      {message && (
        <div
          style={{
            padding: 16,
            background: message.includes("Fehler") ? "#fee" : "#d1fae5",
            color: message.includes("Fehler") ? "#d00" : "#059669",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
          <label style={{ display: "block", marginBottom: 12, fontWeight: 600, color: "#666", fontSize: 14 }}>
            Avatar
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Avatar
              src={profile.avatar_url}
              firstName={profile.display_name?.split(" ")[0]}
              lastName={profile.display_name?.split(" ")[1]}
              size={80}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
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
              {profile.avatar_url && (
                <button
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
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, color: "#666", fontSize: 14 }}>
            E-Mail
          </label>
          <div style={{ padding: 10, background: "#f9f9f9", borderRadius: 8, color: "#333" }}>
            {profile.email}
          </div>
        </div>

        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 600, color: "#666", fontSize: 14 }}>
            Rollen
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {profile.roles.map((role) => (
              <span
                key={role}
                style={{
                  padding: "4px 12px",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  borderRadius: 16,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Anzeigename</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Dein Name"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Vorname</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Max"
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Nachname</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Mustermann"
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Telefon</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+49 123 456789"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Adresse</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Straße</label>
          <input
            type="text"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            placeholder="Musterstraße 123"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Adresszusatz</label>
          <input
            type="text"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            placeholder="2. OG, Hinterhaus"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>PLZ</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="12345"
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Stadt</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Berlin"
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Land</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
            <option value="CH">Schweiz</option>
            <option value="US">USA</option>
            <option value="GB">Vereinigtes Königreich</option>
          </select>
        </div>

        {profile.roles.includes("vendor") && (
          <>
            <h3 style={{ marginTop: 32, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              Zahlungsinformationen (nur für Vendors)
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>IBAN</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="DE89 3704 0044 0532 0130 00"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>BIC</label>
                <input
                  type="text"
                  value={bic}
                  onChange={(e) => setBic(e.target.value)}
                  placeholder="COBADEFFXXX"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Kontoinhaber</label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="Max Mustermann"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>PayPal E-Mail</label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="paypal@beispiel.de"
                style={{
                  width: "100%",
                  padding: 10,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Steuernummer</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="123/456/78901"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>USt-IdNr.</label>
                <input
                  type="text"
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  placeholder="DE123456789"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: saving
              ? "#9ca3af"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>
    </div>
  )
}
