import { useState } from "react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: any) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage((data && data.message) || `Fehler: ${res.status}`)
      } else {
        setMessage("Registrierung erfolgreich. Bitte prüfen Sie Ihre E-Mails oder melden Sie sich an.")
      }
    } catch (err: any) {
      setMessage(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:400,margin:"40px auto"}}>
      <h1>Registrieren</h1>
      <form onSubmit={submit}>
        <div style={{marginBottom:12}}>
          <label>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} required style={{width:"100%"}} />
        </div>
        <div style={{marginBottom:12}}>
          <label>Passwort</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{width:"100%"}} />
        </div>
        <button type="submit" disabled={loading}>{loading?"Bitte warten...":"Registrieren"}</button>
      </form>
      {message && <p style={{marginTop:12}}>{message}</p>}
    </div>
  )
}
