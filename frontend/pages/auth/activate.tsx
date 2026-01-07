import React, { useEffect, useState } from "react"
import HeaderMenu from "../../components/HeaderMenu"

export default function ActivatePage() {
  const [status, setStatus] = useState<{ state: 'idle'|'loading'|'success'|'error', message?: string }>({ state: 'idle' })

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const token = q.get('token')
    if (!token) {
      setStatus({ state: 'error', message: 'Kein Token gefunden' })
      return
    }

    setStatus({ state: 'loading' })
    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const txt = await r.text().catch(() => '')
        try {
          const j = txt ? JSON.parse(txt) : null
          if (r.ok) {
            setStatus({ state: 'success', message: (j && j.ok) ? 'Account aktiviert.' : 'Account aktiviert.' })
          } else {
            setStatus({ state: 'error', message: (j && j.message) ? j.message : txt || `Fehler ${r.status}` })
          }
        } catch (e) {
          if (r.ok) setStatus({ state: 'success', message: 'Account aktiviert.' })
          else setStatus({ state: 'error', message: txt || `Fehler ${r.status}` })
        }
      })
      .catch((e) => setStatus({ state: 'error', message: String(e) }))
  }, [])

  return (
    <div>
      <HeaderMenu />
      <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
        <h1>Account Aktivierung</h1>
        {status.state === 'loading' && <div>Aktiviere Account…</div>}
        {status.state === 'success' && <div style={{ color: 'green' }}>{status.message}</div>}
        {status.state === 'error' && <div style={{ color: '#d00' }}>Fehler: {status.message}</div>}
      </main>
    </div>
  )
}
