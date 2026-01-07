import { useState } from "react"
import { useRouter } from "next/router"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: any) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    // client-side validations
    if (String(password).length < 5) {
      setMessage("Passwort muss mindestens 5 Zeichen lang sein.")
      setLoading(false)
      return
    }
    if (password !== passwordConfirm) {
      setMessage("Passwort und Bestätigung stimmen nicht überein.")
      setLoading(false)
      return
    }
    if (emailExists === true) {
      setMessage("Diese E-Mail ist bereits registriert.")
      setLoading(false)
      return
    }
    try {
      console.log('[store/register] submit', { email, pw_len: String(password).length })
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, password_confirm: passwordConfirm }),
      })
      const text = await res.text().catch(() => '')
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
      console.log('[store/register] response', { status: res.status, body: data })
      if (!res.ok) {
        setMessage((data && data.message) || `Fehler: ${res.status}`)
      } else {
        // If backend returned a token, store it and attempt to fetch user info
        if (data && data.token) {
          try {
            localStorage.setItem('user_token', data.token)
            if (data.user) {
              localStorage.setItem('user_data', JSON.stringify(data.user))
            } else {
              // try to fetch /api/user/me
              const me = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${data.token}` } })
              if (me.ok) {
                const userData = await me.json().catch(() => null)
                if (userData) localStorage.setItem('user_data', JSON.stringify(userData))
              }
            }
            router.push('/')
            return
          } catch (e) {
            console.warn('auto-login failed', e)
          }
        }

        setMessage("Registrierung erfolgreich. Bitte prüfen Sie Ihre E-Mails oder melden Sie sich an.")
      }
    } catch (err: any) {
      setMessage(String(err))
    } finally {
      setLoading(false)
    }
  }

  async function checkEmail() {
    if (!email || !email.includes("@")) return
    try {
      const r = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (r.ok) {
        const d = await r.json()
        setEmailExists(!!d.exists)
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div style={{maxWidth:400,margin:"40px auto"}}>
      <h1>Registrieren</h1>
      <form onSubmit={submit}>
        <div style={{marginBottom:12}}>
          <label>Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} onBlur={checkEmail} required style={{width:"100%"}} />
          {emailExists === true && <div style={{color:'red'}}>E-Mail bereits registriert</div>}
        </div>
        <div style={{marginBottom:12}}>
          <label>Passwort</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{width:"100%"}} />
          {password && password.length < 5 && <div style={{color:'red'}}>Mindestens 5 Zeichen</div>}
        </div>
        <div style={{marginBottom:12}}>
          <label>Passwort bestätigen</label>
          <input type="password" value={passwordConfirm} onChange={(e)=>setPasswordConfirm(e.target.value)} required style={{width:"100%"}} />
          {passwordConfirm && password !== passwordConfirm && <div style={{color:'red'}}>Passwörter stimmen nicht überein</div>}
        </div>
        <button type="submit" disabled={loading || emailExists === true || password.length < 5 || password !== passwordConfirm}>
          {loading?"Bitte warten...":"Registrieren"}
        </button>
      </form>
      {message && <p style={{marginTop:12}}>{message}</p>}
    </div>
  )
}

