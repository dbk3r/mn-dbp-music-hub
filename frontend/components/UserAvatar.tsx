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

  return (
    <button
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "2px solid #ddd",
        background: user.avatar_url ? `url(${user.avatar_url}) center/cover` : "#e0e0e0",
        color: "#333",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!user.avatar_url && initials}
    </button>
  )
}
