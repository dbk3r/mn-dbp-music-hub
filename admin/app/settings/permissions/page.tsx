"use client"

import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

interface Permission {
  id: number
  resource: string
  action: string
  description: string
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [grouped, setGrouped] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [formResource, setFormResource] = useState("")
  const [formAction, setFormAction] = useState("")
  const [formDescription, setFormDescription] = useState("")

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/permissions"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Berechtigungen")
      }

      const data = await response.json()
      setPermissions(data.permissions || [])
      setGrouped(data.grouped || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/permissions"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resource: formResource.trim(),
          action: formAction.trim(),
          description: formDescription.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Fehler beim Erstellen")
      }

      setShowCreateModal(false)
      resetForm()
      setMessage("Berechtigung erfolgreich erstellt")
      setTimeout(() => setMessage(""), 3000)
      loadPermissions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpdate = async () => {
    if (!editingPermission) return

    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/permissions"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingPermission.id,
          description: formDescription.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Fehler beim Aktualisieren")
      }

      setEditingPermission(null)
      resetForm()
      setMessage("Beschreibung erfolgreich aktualisiert")
      setTimeout(() => setMessage(""), 3000)
      loadPermissions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Berechtigung "${permission.resource}:${permission.action}" wirklich löschen?\n\nWarnung: Dies kann Rollen beeinträchtigen, die diese Berechtigung verwenden!`)) return

    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl(`/permissions?id=${permission.id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Fehler beim Löschen")
      }

      setMessage("Berechtigung erfolgreich gelöscht")
      setTimeout(() => setMessage(""), 3000)
      loadPermissions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (permission: Permission) => {
    setFormResource(permission.resource)
    setFormAction(permission.action)
    setFormDescription(permission.description)
    setEditingPermission(permission)
  }

  const resetForm = () => {
    setFormResource("")
    setFormAction("")
    setFormDescription("")
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
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Berechtigungsverwaltung</h1>
          <p style={{ color: "#6b7280" }}>
            Verwalte alle Berechtigungen im System. Diese werden automatisch erkannt und können Rollen zugewiesen werden.
          </p>
        </div>
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
          + Neue Berechtigung
        </button>
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

      <div style={{ display: "grid", gap: 20 }}>
        {Object.entries(grouped).map(([resource, perms]) => (
          <div
            key={resource}
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1f2937" }}>
              {resource}
            </h2>
            
            <div style={{ display: "grid", gap: 12 }}>
              {perms.map(perm => (
                <div
                  key={perm.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    background: "#f9fafb",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "#e0e7ff",
                          color: "#4338ca",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}
                      >
                        {perm.action}
                      </span>
                    </div>
                    <p style={{ color: "#6b7280", fontSize: 13 }}>
                      {perm.description || `${perm.resource}:${perm.action}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEditModal(perm)}
                      style={{
                        padding: "6px 12px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDelete(perm)}
                      style={{
                        padding: "6px 12px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPermission) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => {
            setShowCreateModal(false)
            setEditingPermission(null)
            resetForm()
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 32,
              width: "100%",
              maxWidth: 500,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              {editingPermission ? "Berechtigung bearbeiten" : "Neue Berechtigung erstellen"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Resource
                </label>
                <input
                  type="text"
                  value={formResource}
                  onChange={(e) => setFormResource(e.target.value)}
                  disabled={!!editingPermission}
                  placeholder="z.B. audio, products, users"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    background: editingPermission ? "#f3f4f6" : "white",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Action
                </label>
                <input
                  type="text"
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  disabled={!!editingPermission}
                  placeholder="z.B. view, create, edit, delete"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    background: editingPermission ? "#f3f4f6" : "white",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                  Beschreibung
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Beschreibung der Berechtigung"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={editingPermission ? handleUpdate : handleCreate}
                  disabled={!formResource.trim() || !formAction.trim()}
                  style={{
                    flex: 1,
                    padding: "10px 24px",
                    background: (!formResource.trim() || !formAction.trim()) ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: (!formResource.trim() || !formAction.trim()) ? "not-allowed" : "pointer",
                  }}
                >
                  {editingPermission ? "Aktualisieren" : "Erstellen"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingPermission(null)
                    resetForm()
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 24px",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
