"use client"

import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

interface Permission {
  id: number
  resource: string
  action: string
  description: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, Permission[]>>({})
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/roles"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Rollen")
      }

      const data = await response.json()
      setRoles(data.roles || [])
      setAvailablePermissions(data.availablePermissions || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role)
    const permIds = new Set(role.permissions.map(p => p.id))
    setSelectedPermissionIds(permIds)
  }

  const togglePermission = (permissionId: number) => {
    const newSet = new Set(selectedPermissionIds)
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId)
    } else {
      newSet.add(permissionId)
    }
    setSelectedPermissionIds(newSet)
  }

  const handleSave = async () => {
    if (!selectedRole) return

    setSaving(true)
    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/roles"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissionIds: Array.from(selectedPermissionIds),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Fehler beim Speichern")
      }

      setMessage(`Berechtigungen für Rolle "${selectedRole.name}" erfolgreich gespeichert`)
      setTimeout(() => setMessage(""), 3000)
      
      // Reload roles
      await loadRoles()
      
      // Update selected role
      const updatedRole = roles.find(r => r.id === selectedRole.id)
      if (updatedRole) {
        const refreshedRoles = await fetch(adminApiUrl("/roles"), {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json())
        const newSelectedRole = refreshedRoles.roles.find((r: Role) => r.id === selectedRole.id)
        if (newSelectedRole) {
          setSelectedRole(newSelectedRole)
        }
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getResourceLabel = (resource: string): string => {
    const labels: Record<string, string> = {
      audio: "Audio-Dateien",
      products: "Produkte",
      orders: "Bestellungen",
      users: "Benutzerverwaltung",
      "license-models": "Lizenzmodelle",
      categories: "Kategorien",
      tags: "Tags",
      settings: "Einstellungen",
      admin: "Administration",
      downloads: "Downloads",
      licenses: "Lizenzen",
    }
    return labels[resource] || resource
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      view: "Anzeigen",
      view_all: "Alle anzeigen",
      view_own: "Eigene anzeigen",
      create: "Erstellen",
      edit: "Bearbeiten",
      delete: "Löschen",
      manage: "Verwalten",
      access: "Zugriff",
    }
    return labels[action] || action
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
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Rollenverwaltung</h1>
        <p style={{ color: "#6b7280" }}>
          Konfiguriere für jede Rolle, welche Menüpunkte sichtbar sind und welche Aktionen erlaubt sind.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: 16,
            background: "#d1fae5",
            color: "#059669",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Rollen-Liste */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Rollen</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                style={{
                  padding: 16,
                  background: selectedRole?.id === role.id ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "white",
                  color: selectedRole?.id === role.id ? "white" : "#1f2937",
                  border: selectedRole?.id === role.id ? "none" : "1px solid #e5e7eb",
                  borderRadius: 8,
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: selectedRole?.id === role.id ? 600 : 400,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{role.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {role.permissions.length} Berechtigung{role.permissions.length !== 1 ? "en" : ""}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Berechtigungs-Matrix */}
        <div>
          {selectedRole ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                    Berechtigungen für: {selectedRole.name}
                  </h2>
                  {selectedRole.description && (
                    <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                      {selectedRole.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    background: saving ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Speichere..." : "Speichern"}
                </button>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                {Object.entries(availablePermissions).map(([resource, permissions]) => (
                  <div
                    key={resource}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#1f2937" }}>
                      {getResourceLabel(resource)}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                      {permissions.map(perm => {
                        const isChecked = selectedPermissionIds.has(perm.id)
                        return (
                          <label
                            key={perm.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: 8,
                              background: isChecked ? "#f0f9ff" : "#f9fafb",
                              border: `1px solid ${isChecked ? "#3b82f6" : "#e5e7eb"}`,
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.id)}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ fontWeight: isChecked ? 600 : 400 }}>
                              {getActionLabel(perm.action)}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                color: "#6b7280",
              }}
            >
              Wähle eine Rolle aus, um ihre Berechtigungen zu konfigurieren
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
