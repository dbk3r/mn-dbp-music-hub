
export interface DecodedToken {
  userId: string
  email: string
  roles: Array<{
    name: string
    permissions: Array<{
      resource: string
      action: string
    }>
  }>
}

function base64UrlDecode(input: string): string {
  try {
    const s = input.replace(/-/g, '+').replace(/_/g, '/')
    const pad = s.length % 4
    const base = s + (pad ? '='.repeat(4 - pad) : '')
    if (typeof window !== 'undefined' && typeof atob === 'function') {
      // Browser
      return decodeURIComponent(Array.prototype.map.call(atob(base), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    }
    // Node
    return Buffer.from(base, 'base64').toString('utf8')
  } catch (e) {
    return ''
  }
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payloadJson = base64UrlDecode(parts[1])
    if (!payloadJson) return null
    const payload = JSON.parse(payloadJson)
    return payload as DecodedToken
  } catch (e) {
    return null
  }
}

export function hasPermission(
  decoded: DecodedToken,
  resource: string,
  action: string
): boolean {
  // Admin role has all permissions
  if (decoded.roles.some(r => r.name === 'admin')) {
    return true
  }

  // Check if user has specific permission
  return decoded.roles.some(role =>
    role.permissions.some(
      perm => perm.resource === resource && perm.action === action
    )
  )
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_auth_token')
}

export async function checkAuth(): Promise<DecodedToken | null> {
  const token = getAuthToken()
  if (!token) return null
  return verifyToken(token)
}
