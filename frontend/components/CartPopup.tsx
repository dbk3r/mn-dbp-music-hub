"use client"
import React, { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

let stripePromise: Promise<any> | null = null

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch("/api/config")
      .then(res => res.json())
      .then(config => {
        if (!config.stripe_publishable_key) {
          throw new Error("Stripe publishable key not configured")
        }
        return loadStripe(config.stripe_publishable_key)
      })
  }
  return stripePromise
}

type CartItem = {
  audioId?: number
  title?: string
  licenseModelName?: string
  licenseModelDescription?: string | null
  priceCents?: number
}

type CartPopupProps = {
  cart: CartItem[]
  onClose: () => void
  onCheckout: () => void
  onPaymentSuccess: () => void
  checkoutStatus?: "idle" | "loading" | "success" | "error"
  checkoutTotalCents?: number
  orderId?: number
}

export default function CartPopup({
  cart,
  onClose,
  onCheckout,
  onPaymentSuccess,
  checkoutStatus = "idle",
  checkoutTotalCents,
  orderId,
}: CartPopupProps) {
  function fmtPrice(cents: number | undefined) {
    if (typeof cents !== "number" || !Number.isFinite(cents)) return "–"
    return (cents / 100).toFixed(2)
  }

  const TAX_RATE = 0.19 // 19% assumed

  function centsTax(cents: number | undefined) {
    if (typeof cents !== "number" || !Number.isFinite(cents)) return 0
    return Math.round(cents * TAX_RATE)
  }

  const subtotal = cart.reduce((s, it) => s + (it.priceCents || 0), 0)
  const totalTax = cart.reduce((s, it) => s + centsTax(it.priceCents), 0)
  const grandTotal = subtotal + totalTax

  const isLoading = checkoutStatus === "loading"
  const isSuccess = checkoutStatus === "success"
  const isError = checkoutStatus === "error"

function PaymentForm({ orderId, checkoutTotalCents, onSuccess, onClose }: { orderId: number, checkoutTotalCents?: number, onSuccess: () => void, onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      // Get payment intent
      const response = await fetch("/custom/checkout/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("user_token")}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      })

      if (!response.ok) throw new Error("Payment setup failed")

      const { client_secret } = await response.json()

      // Confirm payment
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Test Customer", // TODO: Get from user profile
          },
        },
      })

      if (result.error) {
        alert(`Payment failed: ${result.error.message}`)
      } else if (result.paymentIntent?.status === "succeeded") {
        alert("Payment successful!")
        onSuccess()
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Kreditkarte
        </label>
        <div style={{
          padding: 12,
          border: "1px solid #ccc",
          borderRadius: 4,
          background: "#fff"
        }}>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" disabled={!stripe || loading}>
          {loading ? "Verarbeite..." : `Bezahlen ${((checkoutTotalCents || 0) / 100).toFixed(2)}€`}
        </button>
        <button type="button" onClick={onClose} disabled={loading}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}

  return (
    <div className="cart-popup-overlay" style={{ background: "var(--cart-overlay-bg)" }}>
      <div className="cart-popup" style={{ background: "var(--cart-popup-bg)", padding: "var(--cart-popup-padding)", borderRadius: "var(--cart-popup-border-radius)", minWidth: "var(--cart-popup-min-width)" }}>
        <h2>Warenkorb</h2>

        {isLoading && (
          <div style={{ margin: "10px 0", color: "#666" }}>Checkout läuft…</div>
        )}
        {isSuccess && (
          <div style={{ margin: "10px 0", color: "#1f7a1f", fontWeight: 600 }}>
            Bestellung angefragt. Summe: {fmtPrice(checkoutTotalCents)}€
          </div>
        )}
        {isError && (
          <div style={{ margin: "10px 0", color: "#b00020", fontWeight: 600 }}>
            Checkout fehlgeschlagen.
          </div>
        )}

        {cart.length === 0 ? (
          <p>Ihr Warenkorb ist leer.</p>
        ) : (
          <div>
            {cart.map((i, k) => (
              <div className="cart-item" key={k}>
                <div style={{flex:1}}>
                  <div className="cart-item-title">{i.title} — {i.licenseModelName}</div>
                  {i.licenseModelDescription ? (
                    <div className="cart-item-licdesc">{i.licenseModelDescription}</div>
                  ) : null}
                </div>
                <div className="cart-line-price">
                  <div>Einzelpreis: {fmtPrice(i.priceCents)}€</div>
                  <div style={{color: 'var(--text-muted)', fontSize: 13}}>Steuer ({Math.round(TAX_RATE*100)}%): {fmtPrice(centsTax(i.priceCents))}€</div>
                </div>
              </div>
            ))}

            <div className="cart-totals">
              <div className="row"><div>Zwischensumme</div><div>{fmtPrice(subtotal)}€</div></div>
              <div className="row"><div>Gesamt Steuer</div><div>{fmtPrice(totalTax)}€</div></div>
              <div className="row" style={{fontSize:16}}><div>Gesamt</div><div>{fmtPrice(grandTotal)}€</div></div>
            </div>
          </div>
        )}

        {orderId && (
          <Elements stripe={getStripePromise()}>
            <PaymentForm
              orderId={orderId}
              checkoutTotalCents={checkoutTotalCents}
              onSuccess={() => {
                // Handle successful payment
                onPaymentSuccess()
                onClose()
                // Could trigger a success callback or redirect
              }}
              onClose={onClose}
            />
          </Elements>
        )}

        {!orderId && (
          <div style={{marginTop:20}}>
            <button disabled={!cart.length || isLoading} onClick={onCheckout}>Zur Kasse</button>
            <button onClick={onClose} style={{marginLeft:10}} disabled={isLoading}>Schließen</button>
          </div>
        )}
      </div>
    </div>
  )
}