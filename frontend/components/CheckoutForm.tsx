"use client"
import React, { useEffect, useState, useRef } from "react"

type CartItem = {
  audioId?: number
  title?: string
  licenseModelId?: number
  licenseModelName?: string
  priceCents?: number
}

export default function CheckoutForm({
  cart,
  cartTotalCents,
  onOrderCreated,
  onError,
}: {
  cart: CartItem[]
  cartTotalCents?: number
  onOrderCreated: (payload: { order_id?: number; total_price_cents?: number; payment_method?: string; billing_name?: string; card_holder_name?: string }) => void
  onError?: (err: any) => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [street, setStreet] = useState("")
  const [houseNumber, setHouseNumber] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [email, setEmail] = useState("")
  const [cardHolderName, setCardHolderName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe")
  const [loading, setLoading] = useState(false)
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null)
  const [stripeAvailable, setStripeAvailable] = useState<boolean>(false)
  const paypalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // fetch paypal client id from config
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => {
        setPaypalClientId(c.paypal_client_id || null)
        setStripeAvailable(Boolean(c.stripe_publishable_key))
      })
      .catch(() => {
        setPaypalClientId(null)
        setStripeAvailable(false)
      })
  }, [])

  useEffect(() => {
    // if cart total is zero, force free checkout
    if (typeof cartTotalCents === 'number' && cartTotalCents === 0) {
      // mark as 'free' by setting paymentMethod to 'stripe' (UI) but we'll send 'free' on create
      setPaymentMethod('stripe')
    }
  }, [cartTotalCents])

  const createOrder = async () => {
    if (!cart.length) return
    setLoading(true)
    try {
      const token = localStorage.getItem("user_token")
      const r = await fetch("/custom/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart.map((c) => ({ audio_id: c.audioId, license_model_id: typeof c.licenseModelId === 'number' ? c.licenseModelId : undefined })),
          customer: {
            first_name: firstName,
            last_name: lastName,
            street,
            house_number: houseNumber,
            postal_code: postalCode,
            email,
          },
          payment_method: (typeof cartTotalCents === 'number' && cartTotalCents === 0) ? 'free' : paymentMethod,
        }),
      })

      // Debug: log response status and body for investigation
      try {
        const clone = r.clone()
        const bodyText = await clone.text()
        // eslint-disable-next-line no-console
        console.log("/custom/checkout response status", r.status, "body:", bodyText)
      } catch (e) {
        // ignore clone/read errors
      }

      if (!r.ok) {
        const text = await r.text()
        throw new Error(text || "Checkout failed")
      }

      const data = await r.json()
      // Debug: log parsed response
      // eslint-disable-next-line no-console
      console.log("/custom/checkout parsed", data)

      onOrderCreated({
        order_id: data.order_id,
        total_price_cents: data.total_price_cents,
        payment_method: paymentMethod,
        billing_name: billingName,
        card_holder_name: paymentMethod === 'stripe' ? cardHolderName || billingName : undefined,
      })
      return data
    } catch (err) {
      console.error("Checkout create error", err)
      onError?.(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paymentMethod !== "paypal") return
    if (!paypalClientId) return

    // inject PayPal SDK when needed
    if (typeof window !== "undefined" && !document.getElementById("paypal-sdk")) {
      const s = document.createElement("script")
      s.id = "paypal-sdk"
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=EUR`
      s.async = true
      document.body.appendChild(s)
    }
  }, [paymentMethod, paypalClientId])

  const billingName = `${firstName} ${lastName}`.trim()

  const isFormValid = () => {
    return Boolean(lastName.trim() && firstName.trim() && email.trim() && cart.length)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Name <span style={{color:'red'}}>*</span></div>
          <input placeholder="Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required aria-required />
        </label>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Vorname <span style={{color:'red'}}>*</span></div>
          <input placeholder="Vorname" value={firstName} onChange={(e) => setFirstName(e.target.value)} required aria-required />
        </label>

        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Straße</div>
          <input placeholder="Straße" value={street} onChange={(e) => setStreet(e.target.value)} />
        </label>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Hausnummer</div>
          <input placeholder="Hausnummer" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
        </label>

        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>PLZ</div>
          <input placeholder="PLZ" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </label>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>E-Mail <span style={{color:'red'}}>*</span></div>
          <input placeholder="E-Mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            onClick={() => { if (stripeAvailable) setPaymentMethod('stripe') }}
            role="button"
            aria-pressed={paymentMethod === 'stripe'}
            aria-disabled={!stripeAvailable}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 6,
              border: paymentMethod === 'stripe' ? '2px solid #2563eb' : '1px solid #ddd', cursor: stripeAvailable ? 'pointer' : 'not-allowed', opacity: stripeAvailable ? 1 : 0.6
            }}
          >
            <input type="radio" name="pm" value="stripe" checked={paymentMethod === "stripe"} onChange={() => setPaymentMethod("stripe")} style={{display:'none'}} />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" style={{height:20}} />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style={{height:18}} />
            <span style={{marginLeft:6}}>Kreditkarte</span>
          </div>

          <div
            onClick={() => setPaymentMethod('paypal')}
            role="button"
            aria-pressed={paymentMethod === 'paypal'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 6,
              border: paymentMethod === 'paypal' ? '2px solid #003087' : '1px solid #ddd', cursor: 'pointer'
            }}
          >
            <input type="radio" name="pm" value="paypal" checked={paymentMethod === "paypal"} onChange={() => setPaymentMethod("paypal")} style={{display:'none'}} />
            <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" style={{height:20}} />
            <span style={{marginLeft:6}}>PayPal</span>
          </div>
        </div>

        {/* Show only the message for the currently selected payment method */}
        {paymentMethod === 'stripe' && !stripeAvailable ? (
          <div style={{ color: '#b00020', fontSize: 13, marginTop: 8 }}>Stripe nicht konfiguriert — Kreditkartenzahlung deaktiviert.</div>
        ) : null}
        {paymentMethod === 'paypal' && !paypalClientId ? (
          <div style={{ color: '#b00020', fontSize: 13, marginTop: 8 }}>PayPal nicht konfiguriert — PayPal deaktiviert.</div>
        ) : null}
      </div>

      {(paymentMethod === 'stripe' && stripeAvailable) ? (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>Karteninhaber/in <span style={{color:'red'}}>*</span></div>
            <input placeholder="Name auf Karte" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} />
          </label>
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button disabled={loading || !isFormValid()} onClick={async () => { try { await createOrder() } catch {} }}>
          {loading ? "Erstelle Bestellung…" : "Bestellung anfragen"}
        </button>
      </div>

      {paymentMethod === "paypal" && paypalClientId && (
        <div style={{ marginTop: 12 }}>
          <div ref={paypalRef} id="paypal-buttons-container">Wenn die Bestellung erstellt ist, erscheinen hier PayPal-Buttons.</div>
        </div>
      )}
    </div>
  )
}
