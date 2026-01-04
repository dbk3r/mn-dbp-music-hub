"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserAvatar from "../components/UserAvatar";
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
}

const menuItems: MenuItem[] = [
  { href: "/products", label: "Produkte", permission: { resource: "products", action: "view" } },
  { href: "/audio", label: "Audio-Dateien", permission: { resource: "audio", action: "view" } },
  { href: "/license-models", label: "Lizenzmodelle", permission: { resource: "license-models", action: "view" } },
  { href: "/categories", label: "Kategorien", permission: { resource: "categories", action: "view" } },
  { href: "/tags", label: "Tags", permission: { resource: "tags", action: "view" } },
  { href: "/users", label: "User", permission: { resource: "users", action: "view" } },
  { href: "/roles", label: "Rollen", permission: { resource: "roles", action: "view" } },
  { href: "/settings", label: "Benutzereinstellungen", permission: { resource: "settings", action: "view" } },
  { href: "/settings/system", label: "Systemeinstellungen", permission: { resource: "admin", action: "manage" } },
]

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [pathname])

  const checkAuthStatus = async () => {
    // Skip auth check for login page (pathname includes basePath)
    if (pathname === '/login' || pathname === '/dbp-admin/login') {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('admin_auth_token')
    
    if (!token) {
      router.push('/login')
      setLoading(false)
      return
    }

    try {
      // Decode JWT to get user permissions
      const payloadBase64 = token.split('.')[1]
      const payload = JSON.parse(atob(payloadBase64))
      
      const roles = payload.roles || []
      const admin = roles.some((r: any) => r.name === 'admin')
      
      // Collect all permissions from all roles
      const permissions: Array<{ resource: string; action: string }> = []
      roles.forEach((role: any) => {
        if (role.permissions) {
          permissions.push(...role.permissions)
        }
      })

      setIsAdmin(admin)
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

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission.resource, item.permission.action)
  })

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
          <div className="mx-auto flex min-h-screen w-full max-w-7xl">
            <aside className="w-64 border-r border-foreground/5 bg-card/30 p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="text-lg font-semibold">DBP Admin</div>
                <UserAvatar />
              </div>
              <nav className="flex flex-col gap-1 text-sm">
                {visibleMenuItems.map(item => (
                  <Link
                    key={item.href}
                    className="rounded px-3 py-2 hover:bg-foreground/5"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
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
