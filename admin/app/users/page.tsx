"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { adminApiUrl } from "../_lib/api"
import UserCreate from "../_components/UserCreate"

type User = {
  id: string
  email: string
  display_name: string | null
  roles?: { id: string | number; name: string }[]
  is_active: boolean
  mfa_enabled: boolean
  status: string
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('admin_auth_token')
      const res = await fetch(adminApiUrl("/users"), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error("Failed to load users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('admin_auth_token')
      const res = await fetch(adminApiUrl(`/users/${userId}`), {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_active: !currentActive }),
      })
      if (!res.ok) throw new Error("Failed to update user")
      await loadUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Benutzer wirklich löschen?")) return
    try {
      const token = localStorage.getItem('admin_auth_token')
      const res = await fetch(adminApiUrl(`/users/${userId}`), {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error("Failed to delete user")
      await loadUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <h1>Benutzerverwaltung</h1>
        <p>Lade...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <h1>Benutzerverwaltung</h1>
        <p style={{ color: "var(--error)" }}>Fehler: {error}</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Benutzerverwaltung</h1>
        <div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Neuen Benutzer</button>
        </div>
      </div>

      <div style={{ background: "var(--card-bg)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--input-bg)", borderBottom: "1px solid var(--input-border)" }}>
              <th style={{ padding: 12, textAlign: "left" }}>Email</th>
              <th style={{ padding: 12, textAlign: "left" }}>Name</th>
              <th style={{ padding: 12, textAlign: "left" }}>Rollen</th>
              <th style={{ padding: 12, textAlign: "center" }}>Status</th>
              <th style={{ padding: 12, textAlign: "center" }}>Aktiv</th>
              <th style={{ padding: 12, textAlign: "center" }}>MFA</th>
              <th style={{ padding: 12, textAlign: "center" }}>Erstellt</th>
              <th style={{ padding: 12, textAlign: "right" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: "1px solid var(--card-border)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: 12 }}>{user.email}</td>
                <td style={{ padding: 12 }}>{user.display_name || "-"}</td>
                <td style={{ padding: 12 }}>{(user.roles && user.roles.length > 0) ? user.roles.map(r => r.name).join(", ") : "-"}</td>
                
                <td style={{ padding: 12, textAlign: "center" }}>
                  <span className={user.status === "active" ? "badge-active" : "badge-draft"}>{user.status}</span>
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  {user.is_active ? "✓" : "✗"}
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  {user.mfa_enabled ? "✓" : "✗"}
                </td>
                <td style={{ padding: 12, textAlign: "center", fontSize: 13 }}>
                  {new Date(user.created_at).toLocaleDateString("de-DE")}
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <button
                    className={user.is_active ? "btn-secondary" : "btn-success"}
                    style={{ marginRight: 8, padding: "6px 12px", fontSize: 13 }}
                    onClick={() => handleToggleActive(user.id, user.is_active)}
                  >
                    {user.is_active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                  <button
                    className="btn-primary"
                    style={{ marginRight: 8, padding: "6px 12px", fontSize: 13 }}
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    Bearbeiten
                  </button>
                  <button
                    className="btn-danger"
                    style={{ padding: "6px 12px", fontSize: 13 }}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
            Keine Benutzer vorhanden
          </div>
        )}
      </div>
      {showCreate && <UserCreate onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadUsers() }} />}
    </div>
  )
}
