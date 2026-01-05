import React, { useEffect, useMemo, useRef, useState } from "react"
import HeaderMenu from "../components/HeaderMenu"
import SearchBar from "../components/SearchBar"
import type { SearchValues } from "../components/SearchBar"
import AudioSearchResultCard from "../components/AudioSearchResultCard"
import StickyAudioPlayer from "../components/StickyAudioPlayer"
import CartIcon from "../components/CartIcon"
import CartPopup from "../components/CartPopup"

type AudioSearchItem = {
  id: number
  title: string
  artist: string | null
  description: string | null
  release_year: number | null
  mime_type: string
  duration_ms: number | null
  waveform_peaks: number[] | null
  cover_url: string | null
  stream_url: string
  category?: string | null
  tags?: string[]
  license_models: Array<{
    id: number
    name: string
    description: string | null
    price_cents: number
  }>
}

type CartItem = {
  audioId: number
  title: string
  licenseModelId: number
  licenseModelName: string
  priceCents: number
}

type SearchResponse = {
  items: AudioSearchItem[]
  nextOffset: number
  hasMore: boolean
}

export default function MainPage() {
  const [results, setResults] = useState<AudioSearchItem[]>([])
  const [selected, setSelected] = useState<AudioSearchItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [lastSearch, setLastSearch] = useState<SearchValues | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [checkoutTotalCents, setCheckoutTotalCents] = useState<number | undefined>(undefined)
  const [orderId, setOrderId] = useState<number | undefined>(undefined)

  async function checkout() {
    if (!cart.length) return

    // Check if user is logged in
    const token = localStorage.getItem("user_token")
    if (!token) {
      alert("Bitte melden Sie sich an, um zu bestellen.")
      return
    }

    try {
      setCheckoutStatus("loading")
      setCheckoutTotalCents(undefined)

      const r = await fetch("/custom/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((c) => ({ audio_id: c.audioId, license_model_id: c.licenseModelId })),
        }),
      })

      if (!r.ok) {
        setCheckoutStatus("error")
        return
      }

      const data = (await r.json()) as { total_price_cents?: number, order_id?: number }
      const total = typeof data.total_price_cents === "number" ? data.total_price_cents : 0
      setCheckoutTotalCents(total)
      setOrderId(data.order_id)
      setCheckoutStatus("success")
      // Don't clear cart yet - wait for payment completion
    } catch {
      setCheckoutStatus("error")
    }
  }

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const searchParams = useMemo(() => {
    if (!lastSearch) return null
    const p = new URLSearchParams()
    if (lastSearch.title?.trim()) p.set("title", lastSearch.title.trim())
    if (lastSearch.artist?.trim()) p.set("artist", lastSearch.artist.trim())
    return p
  }, [lastSearch])

  async function fetchPage(offset: number, baseParams: URLSearchParams) {
    const params = new URLSearchParams(baseParams)
    params.set("limit", "20")
    params.set("offset", String(offset))

    const r = await fetch(`/custom/audio/search?${params.toString()}`, { cache: "no-store" })
    if (!r.ok) {
      throw new Error(`search failed: ${r.status}`)
    }
    return (await r.json()) as SearchResponse
  }

  async function handleSearch(vals: SearchValues) {
    setLastSearch(vals)
    setResults([])
    setSelected(null)
    setNextOffset(0)
    setHasMore(false)
    if (loading) return

    const base = new URLSearchParams()
    if (vals.title?.trim()) base.set("title", vals.title.trim())
    if (vals.artist?.trim()) base.set("artist", vals.artist.trim())

    setLoading(true)
    try {
      const data = await fetchPage(0, base)
      setResults(data.items || [])
      setNextOffset(data.nextOffset || (data.items?.length ?? 0))
      setHasMore(Boolean(data.hasMore))
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (loading || !hasMore || !searchParams) return
    setLoading(true)
    try {
      const data = await fetchPage(nextOffset, searchParams)
      setResults((prev) => [...prev, ...(data.items || [])])
      setNextOffset(data.nextOffset || nextOffset + (data.items?.length ?? 0))
      setHasMore(Boolean(data.hasMore))
    } finally {
      setLoading(false)
    }
  }

  function addToCart(payload: { audioId: number; licenseModelId: number }) {
    const audio = results.find((r) => r.id === payload.audioId)
    if (!audio) return
    const license = audio.license_models.find((l) => l.id === payload.licenseModelId)
    if (!license) return

    setCart((prev) => [
      ...prev,
      {
        audioId: audio.id,
        title: audio.title,
        licenseModelId: license.id,
        licenseModelName: license.name,
        priceCents: license.price_cents,
      },
    ])
    setCartOpen(true)
    setCheckoutStatus("idle")
    setCheckoutTotalCents(undefined)
  }

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    if (!hasMore) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore()
        }
      },
      { rootMargin: "300px" }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loadMore])

  return (
    <div>
      <HeaderMenu
        right={cart.length > 0 ? (
          <CartIcon
            count={cart.length}
            onClick={() => setCartOpen((v) => !v)}
          />
        ) : null}
      />
      <SearchBar onSearch={handleSearch} />
      <div style={{ maxWidth: "100%", width: "100%", margin: "2em auto 0", paddingLeft: 24, paddingRight: 24, paddingBottom: selected ? 220 : 24, boxSizing: "border-box" }}>
        {results.map((item) => (
          <AudioSearchResultCard
            key={item.id}
            item={item}
            onSelect={() => setSelected(item)}
            onAddToCart={addToCart}
          />
        ))}

        <div ref={sentinelRef} />

        {loading && <div style={{ color: "#666", padding: "1em 0" }}>Lade…</div>}
        {!loading && lastSearch && results.length === 0 && (
          <div style={{ color: "#666", padding: "1em 0" }}>Keine Treffer.</div>
        )}
      </div>

      {cartOpen ? (
        <CartPopup
          cart={cart}
          onClose={() => {
            setCartOpen(false)
            setCheckoutStatus("idle")
            setCheckoutTotalCents(undefined)
            setOrderId(undefined)
          }}
          onCheckout={() => {
            void checkout()
          }}
          onPaymentSuccess={() => {
            setCart([]) // Clear cart after successful payment
            setCartOpen(false)
            setCheckoutStatus("idle")
            setCheckoutTotalCents(undefined)
            setOrderId(undefined)
          }}
          checkoutStatus={checkoutStatus}
          checkoutTotalCents={checkoutTotalCents}
          orderId={orderId}
        />
      ) : null}

      <StickyAudioPlayer track={selected} />
    </div>
  )
}