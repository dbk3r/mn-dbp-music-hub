"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  displayName: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
})

export function useAuth() {
  return useContext(AuthContext)
}

const publicPaths = ['/login', '/register']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = () => {
    // Allow public paths
    if (publicPaths.includes(pathname)) {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('user_token')
    const userData = localStorage.getItem('user_data')

    if (!token || !userData) {
      router.push('/login')
      setLoading(false)
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setLoading(false)
    } catch (err) {
      console.error('Invalid user data:', err)
      logout()
    }
  }

  const login = (token: string, userData: User) => {
    localStorage.setItem('user_token', token)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
    router.push('/')
  }

  const logout = () => {
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_data')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
