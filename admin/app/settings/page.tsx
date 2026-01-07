"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
  mfa_enabled: boolean
}

export default function SettingsPage() {
  const router = useRouter()

  // Redirect to the new profile page
  useEffect(() => {
    router.replace('/settings/profile')
  }, [router])

  return <div style={{ padding: 30 }}>Weiterleitung zu Profil…</div>
}
