"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import HeaderMenu from "../components/HeaderMenu"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [mfaRequired, setMfaRequired] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("user_token")
    if (token) {
      router.push("/")
    }
  }, [router])

  const publishableKey = process.env.NEXT_PUBLIC_API_KEY || ""

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (publishableKey) headers["x-publishable-api-key"] = publishableKey

      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers,
        body: JSON.stringify({ email, password }),
      })

      const data = await r.json()

      if (!r.ok) {
        setError(data.message || "Login fehlgeschlagen")
        return
      }

      if (data.mfa_required) {
        setMfaRequired(true)
        setTempToken(data.temp_token)
        return
      }

      localStorage.setItem("user_token", data.token)
      localStorage.setItem("user_data", JSON.stringify(data.user))
      router.push("/")
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (publishableKey) headers["x-publishable-api-key"] = publishableKey

      const r = await fetch("/api/auth/mfa-verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ temp_token: tempToken, otp }),
      })

      const data = await r.json()

      if (!r.ok) {
        setError(data.message || "MFA-Verifikation fehlgeschlagen")
        return
      }

      localStorage.setItem("user_token", data.token)
      localStorage.setItem("user_data", JSON.stringify(data.user))
      router.push("/")
    } catch {
      setError("Netzwerkfehler")
    } finally {
      setLoading(false)
    }
  }

  if (mfaRequired) {
    return (
      <>
        <HeaderMenu right={null} />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)" }}>
          <div style={{ maxWidth: 400, width: "100%", padding: 30, background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <h1 style={{ marginBottom: 20 }}>MFA-Code eingeben</h1>
            {error && <div style={{ marginBottom: 16, padding: 12, background: "#fee", color: "#d00", borderRadius: 8 }}>{error}</div>}
            <form onSubmit={handleMfaVerify}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>6-stelliger Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, fontSize: 16, fontWeight: 600 }}>
                {loading ? "Prüfe..." : "Verifizieren"}
              </button>
            </form>
            <button onClick={() => setMfaRequired(false)} style={{ width: "100%", marginTop: 12, background: "#eee", color: "#333" }}>
              Zurück
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <HeaderMenu right={null} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 60px)" }}>
        <div style={{ maxWidth: 400, width: "100%", padding: 30, background: "#fff", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h1 style={{ marginBottom: 20 }}>Anmelden</h1>
          {error && <div style={{ marginBottom: 16, padding: 12, background: "#fee", color: "#d00", borderRadius: 8 }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
                required
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: 10, fontSize: 16, border: "1px solid #ddd", borderRadius: 8 }}
                required
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, fontSize: 16, fontWeight: 600 }}>
              {loading ? "Anmelden..." : "Anmelden"}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <small style={{ color: '#6b7280' }}>
              Noch keinen Account?{' '}
              <a href="/register" style={{ color: '#1e3a8a', fontWeight: 600 }}>
                Registrieren
              </a>
            </small>
          </div>
        </div>
      </div>
    </>
  )
}
