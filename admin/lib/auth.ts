import { jwtVerify } from 'jose'

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

export async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as DecodedToken
  } catch {
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
