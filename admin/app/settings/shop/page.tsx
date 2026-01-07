"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ShopRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dbp-admin/settings/stripe')
  }, [router])
  return <div style={{ padding: 30 }}>Weiterleitung zu Stripe...</div>
}
