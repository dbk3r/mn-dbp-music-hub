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
    <div style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000
    }}>
      <div style={{background:"#fff",padding:30,borderRadius:12,minWidth:340}}>
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

        {cart.length === 0
          ? <p>Ihr Warenkorb ist leer.</p>
          :(<ul>{cart.map((i, k) =>
            <li key={k}>{i.title} ({i.licenseModelName}) – {fmtPrice(i.priceCents)}€</li>
          )}</ul>)
        }

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