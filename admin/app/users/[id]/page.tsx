"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { adminApiUrl } from "../../_lib/api"

interface User {
  id: string
  email: string
  display_name: string
  is_active: boolean
  mfa_enabled: boolean
  status: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [displayName, setDisplayName] = useState("")
  const [isActive, setIsActive] = useState(false)
  
  const [mfaStage, setMfaStage] = useState<'idle'|'awaiting_pin'|'verified'>('idle')
  const [pinInput, setPinInput] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const headers = { Authorization: `Bearer ${token}` }

      const usersRes = await fetch(adminApiUrl("/admin/users"), { headers })

      if (!usersRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const usersData = await usersRes.json()

      const currentUser = usersData.users.find((u: User) => u.id === userId)
      
      if (!currentUser) {
        throw new Error("User not found")
      }

      setUser(currentUser)
      setDisplayName(currentUser.display_name || "")
      setIsActive(currentUser.is_active)
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl(`/admin/users/${userId}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          is_active: isActive,
        
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update user")
      }

      router.push("/users")
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <p>Lädt...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ padding: 20, background: "#fee", color: "#d00", borderRadius: 8 }}>
          {error}
        </div>
        <button
          onClick={() => router.push("/users")}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#e5e7eb",
            color: "#374151",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Zurück zur Übersicht
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 30 }}>
        <button
          onClick={() => router.push("/users")}
          style={{
            padding: "8px 16px",
            background: "#e5e7eb",
            color: "#374151",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          ← Zurück
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Benutzer bearbeiten</h1>
      </div>

      {error && (
        <div style={{ padding: 16, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, color: "#991b1b", marginBottom: 24 }}>
          {error}
        </div>
      )}

      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 32, maxWidth: 600 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            E-Mail
          </label>
          <input
            type="text"
            value={user?.email || ""}
            disabled
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              background: "#f9fafb",
              color: "#6b7280",
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            E-Mail kann nicht geändert werden
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
            Anzeigename
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ marginRight: 8, width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Account aktiviert
            </span>
          </label>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, marginLeft: 26 }}>
            Aktivierte Benutzer können sich anmelden
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
            Rollen
          </label>
          <div style={{ display: "grid", gap: 10 }}>
            {availableRoles.map(role => (
              <label
                key={role.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: 12,
                  background: selectedRoleIds.includes(role.id) ? "#e0e7ff" : "#f9fafb",
                  border: "1px solid",
                  borderColor: selectedRoleIds.includes(role.id) ? "#6366f1" : "#e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  style={{ marginRight: 12, width: 18, height: 18, cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>
                    {role.name}
                  </div>
                  {role.description && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {role.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/users")}
            style={{
              flex: 1,
              padding: 14,
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: 14,
              background: saving ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
        <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>MFA (E-Mail PIN)</h3>
          {user?.mfa_enabled ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div>Aktiviert</div>
              <button
                onClick={async () => {
                  if (!confirm('MFA für diesen Benutzer deaktivieren?')) return
                  setMfaLoading(true)
                  const token = localStorage.getItem('admin_auth_token')
                  const res = await fetch(adminApiUrl('/mfa/email/disable'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: userId })
                  })
                  setMfaLoading(false)
                  if (res.ok) {
                    // refresh
                    fetchData()
                  } else {
                    alert('Fehler beim Deaktivieren der MFA')
                  }
                }}
                className="btn-danger"
                style={{ padding: '8px 12px' }}
              >
                Deaktivieren
              </button>
            </div>
          ) : (
            <div>
              {mfaStage === 'idle' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      setMfaLoading(true)
                      const token = localStorage.getItem('admin_auth_token')
                      const res = await fetch(adminApiUrl('/mfa/email/start'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ user_id: userId })
                      })
                      setMfaLoading(false)
                      if (res.ok) {
                        setMfaStage('awaiting_pin')
                        alert('PIN wurde an die Nutzer-E-Mail gesendet')
                      } else {
                        alert('Fehler beim Senden des PINs')
                      }
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 12px' }}
                  >
                    MFA aktivieren (PIN senden)
                  </button>
                </div>
              )}

              {mfaStage === 'awaiting_pin' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={pinInput} onChange={(e)=>setPinInput(e.target.value)} placeholder="PIN eingeben" style={{ padding: 8 }} />
                  <button
                    onClick={async () => {
                      setMfaLoading(true)
                      const token = localStorage.getItem('admin_auth_token')
                      const res = await fetch(adminApiUrl('/mfa/email/verify'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ user_id: userId, pin: pinInput })
                      })
                      setMfaLoading(false)
                      if (res.ok) {
                        setMfaStage('verified')
                        alert('MFA aktiviert')
                        fetchData()
                      } else {
                        const data = await res.json().catch(()=>null)
                        alert(data?.message || 'PIN ungültig')
                      }
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 12px' }}
                  >
                    Verifizieren
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
