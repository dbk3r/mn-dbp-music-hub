"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApiUrl } from '../_lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaStage, setMfaStage] = useState<'idle'|'awaiting_pin'>('idle')
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [mfaUserId, setMfaUserId] = useState<string | null>(null)
  const [mfaLoading, setMfaLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/custom/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.message?.includes('not activated')) {
          setError('Ihr Admin-Account wurde noch nicht aktiviert.');
        } else {
          setError(data.message || 'Login fehlgeschlagen');
        }
        setLoading(false);
        return;
      }
      // If MFA required, enter MFA flow
      if (data.mfa_required) {
        setTempToken(data.temp_token)
        if (data.user && data.user.id) {
          setMfaUserId(data.user.id)
          // trigger PIN send for this user
          setMfaLoading(true)
          try {
            const startRes = await fetch(adminApiUrl('/mfa/email/start'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: data.user.id })
            })
            if (!startRes.ok) {
              // continue flow even if send failed; user can request resend
              console.warn('Failed to send MFA PIN')
            } else {
              // optional: notify
              // alert('PIN wurde an Ihre E-Mail gesendet')
            }
          } catch (e) {
            console.warn('mfa start failed', e)
          }
          setMfaLoading(false)
        }
        setMfaStage('awaiting_pin')
        setLoading(false)
        return
      }

      // Store JWT token (normal login)
      localStorage.setItem('admin_auth_token', data.token);
      // Also store user info if returned
      try {
        if (data.user) {
          localStorage.setItem('admin_user', JSON.stringify(data.user))
        } else {
          const me = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${data.token}` } })
          if (me.ok) {
            const userData = await me.json()
            localStorage.setItem('admin_user', JSON.stringify(userData))
          }
        }
      } catch (e) {
        // ignore
      }

      // Redirect to admin dashboard
      router.push('/dbp-admin');
    } catch (err) {
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!tempToken) return setError('Missing temp token')
    setMfaLoading(true)
    try {
      const res = await fetch('/api/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, otp })
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.message || 'PIN ungültig')
        setMfaLoading(false)
        return
      }
      if (d.token) {
        localStorage.setItem('admin_auth_token', d.token)
      }
      if (d.user) {
        try { localStorage.setItem('admin_user', JSON.stringify(d.user)) } catch {}
      }
      setMfaLoading(false)
      router.push('/dbp-admin')
    } catch (err) {
      setError('Verbindungsfehler bei MFA-Verify')
      setMfaLoading(false)
    }
  }

  const handleResendPin = async () => {
    if (!mfaUserId) return
    setMfaLoading(true)
    try {
      const startRes = await fetch(adminApiUrl('/mfa/email/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: mfaUserId })
      })
      if (!startRes.ok) {
        const d = await startRes.json().catch(()=>null)
        setError(d?.message || 'Fehler beim Senden des PINs')
      } else {
        setError('PIN erneut gesendet')
      }
    } catch (e) {
      setError('Fehler beim Senden des PINs')
    }
    setMfaLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
          }}>
            🎵
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1a202c',
            marginBottom: '8px',
          }}>
            Admin Login
          </h1>
          <p style={{
            color: '#718096',
          }}>
            Music Hub Administration
          </p>
        </div>

        {mfaStage === 'awaiting_pin' ? (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '20px' }}>
              <p>Ein PIN wurde an Ihre E-Mail gesendet. Bitte geben Sie den PIN hier ein.</p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="PIN"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                disabled={mfaLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: mfaLoading ? '#9ca3af' : 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                {mfaLoading ? 'Verifizieren...' : 'PIN verifizieren'}
              </button>
              <button
                type="button"
                onClick={handleResendPin}
                disabled={mfaLoading}
                style={{
                  padding: '12px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                PIN erneut senden
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
            >
              {loading ? 'Anmelden...' : 'Als Admin anmelden'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
