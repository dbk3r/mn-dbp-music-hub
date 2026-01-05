import React, { useEffect, useState } from "react"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripePromise } from "../lib/stripe"

type CartItem = {
  audioId?: number
  title?: string
  licenseModelName?: string
  licenseModelDescription?: string | null
  priceCents?: number
  licenseModelId?: number
}

function fmtPrice(cents: number | undefined) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "–"
  return (cents / 100).toFixed(2)
}

function centsTax(cents: number | undefined, rate = 0.19) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return 0
  return Math.round(cents * rate)
}

function PaymentForm({ orderId, totalCents, onSuccess, onClose }: { orderId: number, totalCents?: number, onSuccess: () => void, onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const resp = await fetch("/custom/checkout/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("user_token")}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      })

      if (!resp.ok) throw new Error("Payment setup failed")
      const { client_secret } = await resp.json()

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: "Kunde" },
        },
      })

      if (result.error) {
        alert(`Zahlung fehlgeschlagen: ${result.error.message}`)
      } else if (result.paymentIntent?.status === "succeeded") {
        alert("Zahlung erfolgreich")
        onSuccess()
      }
    } catch (err) {
      console.error(err)
      alert("Zahlung fehlgeschlagen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Kreditkarte</label>
        <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}>
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770' } } }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={!stripe || loading}>{loading ? "Verarbeite..." : `Bezahlen ${( (totalCents||0)/100).toFixed(2)}€`}</button>
        <button type="button" onClick={onClose} disabled={loading}>Abbrechen</button>
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderId, setOrderId] = useState<number | undefined>(undefined)
  const [totalCents, setTotalCents] = useState<number | undefined>(undefined)
  const TAX_RATE = 0.19

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCart(parsed)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const subtotal = cart.reduce((s, it) => s + (it.priceCents || 0), 0)
  const totalTax = cart.reduce((s, it) => s + centsTax(it.priceCents, TAX_RATE), 0)
  const grandTotal = subtotal + totalTax

  async function createOrder() {
    const token = localStorage.getItem('user_token')
    if (!token) {
      alert('Bitte melden Sie sich an, um zu bestellen.')
      return
    }

    try {
      const r = await fetch('/custom/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: cart.map(c => ({ audio_id: c.audioId, license_model_id: c.licenseModelId })) }),
      })

      if (!r.ok) { alert('Bestellung konnte nicht erstellt werden'); return }
      const data = await r.json()
      setOrderId(data.order_id)
      setTotalCents(data.total_price_cents)
      // keep cart until successful payment
    } catch (e) {
      console.error(e)
      alert('Fehler beim Erstellen der Bestellung')
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '2em auto', padding: 16 }}>
      <h1>Kasse</h1>

      {cart.length === 0 ? (
        <p>Ihr Warenkorb ist leer.</p>
      ) : (
        <div>
          <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            {cart.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #fafafa' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{i.title} — {i.licenseModelName}</div>
                  {i.licenseModelDescription ? <div style={{ color: '#666', fontSize: 13 }}>{i.licenseModelDescription}</div> : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>{fmtPrice(i.priceCents)}€</div>
                  <div style={{ color: '#777', fontSize: 13 }}>Steuer: {fmtPrice(centsTax(i.priceCents, TAX_RATE))}€</div>
                </div>
              </div>
            ))}
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Zwischensumme<div>{fmtPrice(subtotal)}€</div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Gesamt Steuer<div>{fmtPrice(totalTax)}€</div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>Gesamt<div>{fmtPrice(grandTotal)}€</div></div>
            </div>
          </div>

          {!orderId ? (
            <div style={{ marginTop: 16 }}>
              <button onClick={createOrder}>Bestellung erstellen und bezahlen</button>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Zahlung für Bestellung #{orderId}</div>
              <Elements stripe={getStripePromise()}>
                <PaymentForm orderId={orderId} totalCents={totalCents} onSuccess={() => {
                  // clear cart on payment success
                  setCart([])
                  localStorage.removeItem('cart')
                  alert('Danke! Ihre Bestellung wurde abgeschlossen.')
                }} onClose={() => setOrderId(undefined)} />
              </Elements>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
