"use client"
import { useEffect, useState } from "react"
import { adminApiUrl } from "../_lib/api"

type Props = {
  onCreated: () => void
  onClose: () => void
}

export default function UserCreate({ onCreated, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [roleId, setRoleId] = useState<string | null>(null)
  const [roles, setRoles] = useState<Array<any>>([])
  const [createCustomer, setCreateCustomer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = async () => {
      try {
        const token = localStorage.getItem('admin_auth_token')
        const r = await fetch(adminApiUrl('/roles'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!r.ok) return
        const data = await r.json()
        setRoles(data.roles || data || [])
        if ((data.roles || data || []).length > 0) setRoleId(String((data.roles || data || [])[0].id))
      } catch (e) {}
    }
    t()
  }, [])

  async function create() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('admin_auth_token')
      const body: any = { email }
      if (displayName) body.display_name = displayName
      if (password) body.password = password
      if (roleId) body.roles = [Number(roleId)]
      if (createCustomer) body.create_customer = true

      const res = await fetch(adminApiUrl('/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Fehler beim Anlegen')
      }
      onCreated()
      onClose()
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: 20, width: 520, borderRadius: 8 }}>
        <h2>Neuen Benutzer anlegen</h2>
        {error && <div style={{ color: '#900', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#444' }}>E‑Mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#444' }}>Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: '100%', padding: 8 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#444' }}>Passwort</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" style={{ width: '100%', padding: 8 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#444' }}>Rolle</label>
            <select value={roleId || ''} onChange={(e) => setRoleId(e.target.value)} style={{ width: '100%', padding: 8 }}>
              <option value="">-- keine --</option>
              {roles.map((r: any) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="create-customer" type="checkbox" checked={createCustomer} onChange={(e) => setCreateCustomer(e.target.checked)} />
            <label htmlFor="create-customer" style={{ fontSize: 13 }}>Store‑Konto erstellen (customer)</label>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={loading}>Abbrechen</button>
          <button onClick={create} className="btn-primary" disabled={loading}>{loading ? 'Erstellt...' : 'Erstellen'}</button>
        </div>
      </div>
    </div>
  )
}
