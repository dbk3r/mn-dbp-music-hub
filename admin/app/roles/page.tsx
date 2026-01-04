"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { adminApiUrl } from "../_lib/api"

interface Permission {
  id: string
  resource: string
  action: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const headers = { Authorization: `Bearer ${token}` }

      const [rolesRes, permsRes] = await Promise.all([
        fetch(adminApiUrl("/roles"), { headers }),
        fetch(adminApiUrl("/permissions"), { headers }),
      ])

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const rolesData = await rolesRes.json()
      const permsData = await permsRes.json()

      setRoles(rolesData.roles)
      setPermissions(permsData.permissions)
    } catch (err) {
      setError("Fehler beim Laden der Daten")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/roles"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          permission_ids: selectedPermissions,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create role")
      }

      setShowCreateModal(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpdate = async () => {
    if (!editingRole) return

    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl(`/roles/${editingRole.id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          permission_ids: selectedPermissions,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to update role")
      }

      setEditingRole(null)
      resetForm()
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`Rolle "${role.name}" wirklich löschen?`)) return

    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl(`/roles/${role.id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete role")
      }

      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (role: Role) => {
    setFormName(role.name)
    setFormDescription(role.description)
    setSelectedPermissions(role.permissions.map(p => p.id))
    setEditingRole(role)
  }

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setSelectedPermissions([])
  }

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    )
  }

  const groupPermissionsByResource = () => {
    const grouped: Record<string, Permission[]> = {}
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) grouped[perm.resource] = []
      grouped[perm.resource].push(perm)
    })
    return grouped
  }

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <p>Lädt...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ padding: 20, background: "#fee", color: "#d00", borderRadius: 8 }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Rollen & Berechtigungen</h1>
        <button
          onClick={openCreateModal}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Neue Rolle
        </button>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        {roles.map(role => (
          <div
            key={role.id}
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{role.name}</h2>
                <p style={{ color: "#6b7280", fontSize: 14 }}>{role.description}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEditModal(role)}
                  style={{
                    padding: "8px 16px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Bearbeiten
                </button>
                {!["admin", "user", "guest"].includes(role.name) && (
                  <button
                    onClick={() => handleDelete(role)}
                    style={{
                      padding: "8px 16px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Löschen
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                Berechtigungen ({role.permissions.length}):
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {role.permissions.map(perm => (
                  <span
                    key={perm.id}
                    style={{
                      padding: "4px 12px",
                      background: "#e0e7ff",
                      color: "#4338ca",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {perm.resource}:{perm.action}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>Keine Berechtigungen</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRole) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false)
              setEditingRole(null)
              resetForm()
            }
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 32,
              width: "90%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              {editingRole ? "Rolle bearbeiten" : "Neue Rolle erstellen"}
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={editingRole?.name === "admin"}
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
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                Beschreibung
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Berechtigungen
              </label>
              {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
                <div key={resource} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#4b5563", marginBottom: 8 }}>
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                    {perms.map(perm => (
                      <label
                        key={perm.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: 8,
                          background: selectedPermissions.includes(perm.id) ? "#e0e7ff" : "#f9fafb",
                          border: "1px solid",
                          borderColor: selectedPermissions.includes(perm.id) ? "#6366f1" : "#e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          style={{ marginRight: 8 }}
                        />
                        {perm.action}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingRole(null)
                  resetForm()
                }}
                style={{
                  padding: "10px 20px",
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
                onClick={editingRole ? handleUpdate : handleCreate}
                disabled={!formName.trim()}
                style={{
                  padding: "10px 20px",
                  background: formName.trim() ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: formName.trim() ? "pointer" : "not-allowed",
                }}
              >
                {editingRole ? "Aktualisieren" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
