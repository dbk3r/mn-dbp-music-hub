import { useState } from "react"

export default function LoginPage() {
  const [step, setStep] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  function handleLogin(e) {
    e.preventDefault()
    fetch("http://localhost:9000/store/auth/init", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    })
      .then(r=>r.json())
      .then(data => {
        if (data.status === "require_pin") setStep("pin")
        else setError(data.error || "Fehler")
      })
      .catch(() => setError("Netzwerkfehler"))
  }

  function handlePin(e) {
    e.preventDefault()
    fetch("http://localhost:9000/store/auth/verify-pin", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, pin }),
      credentials: 'include'
    })
      .then(r=>r.json())
      .then(data => {
        if (data.status === "logged_in") window.location.href = "/"
        else setError(data.error || "Fehler")
      })
      .catch(() => setError("Netzwerkfehler"))
  }

  return (
    <div>
      {step==="login" ? (
        <form onSubmit={handleLogin}>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" required /><br/>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Passwort" required /><br/>
          <button>Login</button>
          {error && <p style={{color:"red"}}>{error}</p>}
        </form>
      ) : (
        <form onSubmit={handlePin}>
          <p>PIN kommt per E-Mail. Bitte eingeben:</p>
          <input value={pin} onChange={e=>setPin(e.target.value)} type="text" placeholder="PIN" required /><br/>
          <button>PIN bestätigen</button>
          {error && <p style={{color:"red"}}>{error}</p>}
        </form>
      )}
    </div>
  )
}