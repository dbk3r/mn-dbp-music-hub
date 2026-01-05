"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"

type User = {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
}

type UserAvatarProps = {
  onClick: () => void
}

export default function UserAvatar({ onClick }: UserAvatarProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user_data")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {}
    }
  }, [])

  if (!user) {
    return (
      <button onClick={() => router.push("/login")} style={{ padding: "8px 16px", borderRadius: 8 }}>
        Anmelden
      </button>
    )
  }

  const initials = (user.display_name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const defaultAvatarSvg = `<?xml version='1.0' encoding='utf-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%23eaeaea' width='24' height='24' rx='4'/><g fill='%23888'><circle cx='12' cy='8' r='3'/><path d='M12 13c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z'/></g></svg>`
  const defaultAvatar = `data:image/svg+xml;utf8,${encodeURIComponent(defaultAvatarSvg)}`

  return (
    <button
      onClick={onClick}
      aria-label={user.display_name || user.email}
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "2px solid #ddd",
        background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : `url(${defaultAvatar}) center/cover`,
        color: "#333",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    />
  )
}
