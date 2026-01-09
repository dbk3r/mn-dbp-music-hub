"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import UserAvatar from "../components/UserAvatar";
import { adminApiUrl } from "./_lib/api";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface MenuItem {
  href: string
  label: string
  permission?: { resource: string; action: string }
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    href: "/shop",
    label: "Shop",
    permission: { resource: "orders", action: "view" },
    children: [
      { href: "/shop/orders", label: "Bestellungen", permission: { resource: "orders", action: "view" } },
    ],
  },
  {
    href: "/content",
    label: "Content",
    permission: { resource: "audio", action: "view" },
    children: [
      { href: "/content/audio", label: "Audio-Dateien", permission: { resource: "audio", action: "view" } },
      { href: "/content/license-models", label: "Lizenzmodelle", permission: { resource: "license-models", action: "view" } },
      { href: "/content/categories", label: "Kategorien", permission: { resource: "categories", action: "view" } },
      { href: "/content/tags", label: "Tags", permission: { resource: "tags", action: "view" } },
    ],
  },
  {
    href: "/settings",
    label: "Einstellungen",
    permission: { resource: "settings", action: "edit" },
    children: [
      { href: "/settings/stripe", label: "Stripe", permission: { resource: "admin", action: "manage" } },
      { href: "/settings/tax", label: "Steuern", permission: { resource: "settings", action: "edit" } },
      { href: "/settings/paypal", label: "PayPal", permission: { resource: "settings", action: "edit" } },
      { href: "/settings/tinymce", label: "TinyMCE", permission: { resource: "settings", action: "edit" } },
      { href: "/settings/license-template", label: "Audio-Lizenz Template", permission: { resource: "settings", action: "edit" } },
      { href: "/settings/email-template", label: "E-Mail Template", permission: { resource: "settings", action: "edit" } },
      { href: "/users", label: "Benutzerverwaltung", permission: { resource: "users", action: "view" } },
    ],
  },
  // Users are accessible via avatar menu; roles removed
]

function Collapsible({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    if (!innerRef.current) return
    // measure content height
    setHeight(innerRef.current.scrollHeight)
  }, [children])

  useEffect(() => {
    if (!innerRef.current) return
    // update measurement when opening
    if (isOpen) setHeight(innerRef.current.scrollHeight)
  }, [isOpen])

  return (
    <div style={{ overflow: "hidden", height: isOpen ? height : 0, transition: "height 200ms ease" }} aria-hidden={!isOpen}>
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userPermissions, setUserPermissions] = useState<Array<{ resource: string; action: string }>>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [pathname])

  // Intercept all client fetch calls and force login on 401/403 responses
  useEffect(() => {
    if (typeof window === 'undefined') return
    const originalFetch = window.fetch
    ;(window as any).fetch = async (...args: any[]) => {
      try {
        const urlArg = args[0]
        const opts = args[1] || {}
        const method = (opts.method || 'GET').toString().toUpperCase()
        const headers = new Headers(opts.headers || {})
        const hadAuthHeader = headers.has('Authorization')
        const tokenPresent = !!localStorage.getItem('admin_auth_token')

        // If a client token exists, check expiry before issuing the request.
        // If expired and this looks like an admin call, force login immediately
        // to avoid the UI performing the request and receiving a 401 HTML login page.
        try {
          const clientToken = localStorage.getItem('admin_auth_token')
          if (clientToken) {
            const parts = clientToken.split('.')
            if (parts.length >= 2) {
              const payload = JSON.parse(atob(parts[1]))
              if (payload && payload.exp) {
                const nowSec = Math.floor(Date.now() / 1000)
                if (nowSec >= payload.exp) {
                  const originUrl = String(urlArg || '')
                  const looksLikeAdminCall = originUrl.includes('/admin') || originUrl.includes('/dbp-admin') || hadAuthHeader
                  if (looksLikeAdminCall) {
                    localStorage.removeItem('admin_auth_token')
                    router.push('/login')
                    return new Response(JSON.stringify({ error: 'token_expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore parsing errors and continue
        }

        const res: Response = await (originalFetch as any)(...args)

        // Logging to help debug why we get redirected on specific requests
        try {
          const contentType = res.headers.get('content-type') || ''
          const isHtml = contentType.includes('text/html')
          const preview = isHtml ? await res.clone().text().then(t => t.slice(0, 1000)) : undefined
          // eslint-disable-next-line no-console
          console.groupCollapsed('[auth-fetch] ', method, String(urlArg), '->', res.status)
          // eslint-disable-next-line no-console
          console.log('hadAuthHeader:', hadAuthHeader, 'tokenPresent:', tokenPresent, 'content-type:', contentType)
          if (preview) {
            // eslint-disable-next-line no-console
            console.log('responsePreview:', preview)
          }
          // eslint-disable-next-line no-console
          console.groupEnd()
        } catch (e) {
          // ignore logging errors
        }

        // Direct 401/403 -> force login (authorized request expected)
        if (res && (res.status === 401 || res.status === 403)) {
          // Only force login if the original request was an admin API call or had an auth header
          const originUrl = String(urlArg || '')
          const looksLikeAdminCall = originUrl.includes('/admin') || originUrl.includes('/dbp-admin') || hadAuthHeader
          if (looksLikeAdminCall) {
            localStorage.removeItem('admin_auth_token')
            router.push('/login')
            return new Response(JSON.stringify({ error: 'auth_required' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
          }
          return res
        }

        // Detect HTML login pages and treat them as auth required only for admin calls.
        // Only consider it a login page if the HTML contains specific markers from our login page
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          const text = await res.clone().text()
          if (text) {
            const lowered = text.toLowerCase()
            const looksLikeLoginHtml = lowered.includes('admin login') || lowered.includes('music hub administration') || lowered.includes('<form') && lowered.includes('password')
            if (looksLikeLoginHtml) {
              const originUrl = String(urlArg || '')
              const looksLikeAdminCall = originUrl.includes('/admin') || originUrl.includes('/dbp-admin') || hadAuthHeader
              if (looksLikeAdminCall) {
                localStorage.removeItem('admin_auth_token')
                router.push('/login')
                return new Response(JSON.stringify({ error: 'auth_required' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
              }
            }
          }
        }

        return res
      } catch (err) {
        // network error - rethrow
        throw err
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const checkAuthStatus = async () => {
    // Skip auth check for login page (pathname includes basePath)
    if (pathname === '/login' || pathname === '/dbp-admin/login') {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('admin_auth_token')
    
    if (!token) {
      // Try server-side service token before forcing login. This allows a
      // development environment with a configured service token to access
      // admin pages even without a client token.
      try {
        const res = await fetch(adminApiUrl('/server-auth-status'))
        if (res.ok) {
          const data = await res.json()
          if (data?.available) {
            setIsAdmin(true)
            setIsAuthenticated(true)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        // ignore and fall through to login
      }

      router.push('/login')
      setLoading(false)
      return
    }

    try {
      // Decode JWT to get user permissions
      const payloadBase64 = token.split('.')[1]
      const payload = JSON.parse(atob(payloadBase64))
      // If token contains exp, check expiry (exp is in seconds)
      if (payload && payload.exp) {
        const nowSec = Math.floor(Date.now() / 1000)
        if (nowSec >= payload.exp) {
          // token expired
          localStorage.removeItem('admin_auth_token')
          router.push('/login')
          setLoading(false)
          return
        }
      }
      
      const rolesRaw = payload.roles || []

      // Normalize roles: roles may be strings or objects with name/permissions
      const roleNames: string[] = []
      const permissions: Array<{ resource: string; action: string }> = []
      if (Array.isArray(rolesRaw)) {
        rolesRaw.forEach((r: any) => {
          if (!r) return
          if (typeof r === 'string') {
            roleNames.push(r.toLowerCase())
          } else if (typeof r === 'object') {
            if (r.name) roleNames.push(String(r.name).toLowerCase())
            if (Array.isArray(r.permissions)) {
              r.permissions.forEach((p: any) => {
                if (p && p.resource && p.action) permissions.push({ resource: p.resource, action: p.action })
              })
            }
          }
        })
      }

      // Also accept explicit admin flag in token payload
      const admin = roleNames.includes('admin') || payload.isAdmin === true

      // If token does not indicate admin, treat as unauthenticated
      if (!admin) {
        localStorage.removeItem('admin_auth_token')
        router.push('/login')
        setLoading(false)
        return
      }

      setIsAdmin(true)
      setUserPermissions(permissions)
      setIsAuthenticated(true)
      setLoading(false)
    } catch (err) {
      console.error('Invalid token:', err)
      localStorage.removeItem('admin_auth_token')
      router.push('/login')
    }
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (isAdmin) return true
    return userPermissions.some(p => p.resource === resource && p.action === action)
  }

  const visibleMenuItems = menuItems
    .map(item => {
      if (!item.permission || hasPermission(item.permission.resource, item.permission.action)) {
        // filter children by permission
        const children = item.children ? item.children.filter(c => !c.permission || hasPermission(c.permission.resource, c.permission.action)) : undefined
        return { ...item, children }
      }
      return null
    })
    .filter(Boolean) as MenuItem[]

  // Show loading state
  if (loading) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="min-h-screen flex items-center justify-center">
            <p>Lädt...</p>
          </div>
        </body>
      </html>
    )
  }

  // Show login page without sidebar (pathname includes basePath)
  if (pathname === '/login' || pathname === '/dbp-admin/login') {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background text-foreground">
          <div className="mx-auto flex min-h-screen w-full">
            <aside className="w-64 border-r border-foreground/5 bg-card/30 p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">DBP Admin</div>
                <UserAvatar />
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                {visibleMenuItems.map(item => (
                  <div key={item.href}>
                    {item.children && item.children.length > 0 ? (
                      <div className="mb-1">
                        <div
                          onClick={() => setExpanded(prev => ({ ...prev, [item.href]: !prev[item.href] }))}
                          className="rounded px-3 py-2 font-semibold flex items-center justify-between cursor-pointer hover:bg-foreground/5"
                        >
                          <span>{item.label}</span>
                          <span style={{ transform: expanded[item.href] ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>▶</span>
                        </div>
                        <div className="ml-3 mt-1">
                          <Collapsible isOpen={!!expanded[item.href]}>
                            <div className="flex flex-col gap-1">
                              {item.children.map(child => (
                                <Link key={child.href} className="rounded px-3 py-2 hover:bg-foreground/5 text-sm block" href={child.href}>
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </Collapsible>
                        </div>
                      </div>
                    ) : (
                      <Link key={item.href} className="rounded px-3 py-2 hover:bg-foreground/5" href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </aside>

            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
