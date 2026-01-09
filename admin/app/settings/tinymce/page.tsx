"use client"

import { useState, useEffect } from "react"
import { adminApiUrl } from "../../_lib/api"

export default function TinyMCESettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/settings/tinymce"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Einstellungen")
      }

      const data = await response.json()
      setApiKey(data.tinymce_api_key || "")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const token = localStorage.getItem("admin_auth_token")
      const response = await fetch(adminApiUrl("/settings/tinymce"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tinymce_api_key: apiKey,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Fehler beim Speichern")
      }

      setMessage("TinyMCE API-Key erfolgreich gespeichert")
      setTimeout(() => setMessage(""), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
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

  return (
    <div style={{ padding: 40, maxWidth: 800 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        TinyMCE Einstellungen
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 32 }}>
        Konfigurieren Sie den TinyMCE Rich Text Editor API-Key
      </p>

      {error && (
        <div
          style={{
            padding: 16,
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

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

      <form onSubmit={handleSave}>
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="apiKey"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              TinyMCE API-Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ihr TinyMCE API-Key"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
              Holen Sie sich einen kostenlosen API-Key bei{" "}
              <a
                href="https://www.tiny.cloud/auth/signup/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                TinyMCE
              </a>
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
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
              {saving ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </div>
      </form>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 8,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          ℹ️ Hinweis
        </h3>
        <p style={{ fontSize: 13, color: "#1e40af" }}>
          Der TinyMCE API-Key wird für den Rich Text Editor im E-Mail- und Lizenz-Template verwendet.
          Ein API-Key ist erforderlich, um alle Editor-Funktionen nutzen zu können.
        </p>
      </div>
    </div>
  )
}
