"use client"
import React, { useState, useEffect } from "react"
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripePromise } from "../lib/stripe"
import CheckoutForm from "./CheckoutForm"

function PayPalRenderer({ amountCents, onSuccess }: { amountCents: number, onSuccess: () => void }) {
  useEffect(() => {
    let mounted = true
    const render = async () => {
      if (!mounted) return
      // wait for paypal sdk
      const waitForPaypal = () => new Promise<void>((resolve) => {
        const check = () => {
          // @ts-ignore
          if ((window as any).paypal) return resolve()
          setTimeout(check, 200)
        }
        check()
      })

      try {
        await waitForPaypal()
        // @ts-ignore
        const paypal = (window as any).paypal
        if (!paypal) return
        const container = document.getElementById("paypal-buttons")
        if (!container) return

        // Clear previous
        container.innerHTML = ""

        paypal.Buttons({
          createOrder: async function () {
            const r = await fetch("/api/paypal/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: amountCents }),
            })
            const json = await r.json()
            if (!r.ok) throw new Error(JSON.stringify(json))
            return json.id
          },
          onApprove: async function (data: any) {
            const r = await fetch("/api/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paypalOrderId: data.orderID }),
            })
            const json = await r.json()
            if (!r.ok) throw new Error(JSON.stringify(json))
            onSuccess()
          },
          onError: function (err: any) {
            console.error("PayPal error", err)
            alert("PayPal-Fehler: " + (err?.message || String(err)))
          }
        }).render(container)
      } catch (err) {
        console.error("PayPal render failed", err)
      }
    }

    render()
    return () => { mounted = false }
  }, [amountCents, onSuccess])

  return null
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
  onOrderCreated?: (payload: { order_id?: number; total_price_cents?: number; payment_method?: string }) => void
  onRemoveItem?: (index: number) => void
  paymentMethod?: string | undefined
  billingName?: string | undefined
}

export default function CartPopup({
  cart,
  onClose,
  onCheckout,
  onPaymentSuccess,
  checkoutStatus = "idle",
  checkoutTotalCents,
  orderId,
  onOrderCreated,
  onRemoveItem,
  paymentMethod,
  billingName,
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

function PaymentForm({ orderId, checkoutTotalCents, onSuccess, onClose, billingName }: { orderId: number, checkoutTotalCents?: number, onSuccess: () => void, onClose: () => void, billingName?: string | undefined }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardHolder, setCardHolder] = useState<string>(billingName || "")

  React.useEffect(() => {
    setCardHolder(billingName || "")
  }, [billingName])
  const [numberError, setNumberError] = useState<string | null>(null)
  const [expiryError, setExpiryError] = useState<string | null>(null)
  const [cvcError, setCvcError] = useState<string | null>(null)
  const [numberFocused, setNumberFocused] = useState(false)
  const [expiryFocused, setExpiryFocused] = useState(false)
  const [cvcFocused, setCvcFocused] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)

    try {
      const cardNumberElement = elements.getElement(CardNumberElement)
      if (!cardNumberElement) throw new Error("CardNumber element not found")

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
          card: cardNumberElement,
          billing_details: {
            name: cardHolder || billingName || "",
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
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Karteninhaber/in</label>
        <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Name auf Karte" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Kartennummer</label>
          <div id="card-number-wrapper" style={{ padding: 10, border: numberError ? '1px solid #b00020' : (numberFocused ? '1px solid #2563eb' : '1px solid #ccc'), borderRadius: 6, background: '#fff' }} aria-invalid={!!numberError} aria-describedby={numberError ? 'card-number-error' : undefined}>
            <CardNumberElement
              options={{ style: { base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } }, invalid: { color: '#9e2146' } } }}
              onChange={(e: any) => setNumberError(e.error ? e.error.message : null)}
              onFocus={() => setNumberFocused(true)}
              onBlur={() => setNumberFocused(false)}
            />
          </div>
          {numberError ? <div id="card-number-error" style={{ color: '#b00020', fontSize: 13, marginTop: 6 }}>{numberError}</div> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Gültig bis</label>
            <div id="card-expiry-wrapper" style={{ padding: 10, border: expiryError ? '1px solid #b00020' : (expiryFocused ? '1px solid #2563eb' : '1px solid #ccc'), borderRadius: 6, background: '#fff' }} aria-invalid={!!expiryError} aria-describedby={expiryError ? 'card-expiry-error' : undefined}>
              <CardExpiryElement
                options={{ style: { base: { fontSize: '16px', color: '#424770' }, invalid: { color: '#9e2146' } } }}
                onChange={(e: any) => setExpiryError(e.error ? e.error.message : null)}
                onFocus={() => setExpiryFocused(true)}
                onBlur={() => setExpiryFocused(false)}
              />
            </div>
            {expiryError ? <div id="card-expiry-error" style={{ color: '#b00020', fontSize: 13, marginTop: 6 }}>{expiryError}</div> : null}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Prüfcode (CVC)</label>
            <div id="card-cvc-wrapper" style={{ padding: 10, border: cvcError ? '1px solid #b00020' : (cvcFocused ? '1px solid #2563eb' : '1px solid #ccc'), borderRadius: 6, background: '#fff' }} aria-invalid={!!cvcError} aria-describedby={cvcError ? 'card-cvc-error' : undefined}>
              <CardCvcElement
                options={{ style: { base: { fontSize: '16px', color: '#424770' }, invalid: { color: '#9e2146' } } }}
                onChange={(e: any) => setCvcError(e.error ? e.error.message : null)}
                onFocus={() => setCvcFocused(true)}
                onBlur={() => setCvcFocused(false)}
              />
            </div>
            {cvcError ? <div id="card-cvc-error" style={{ color: '#b00020', fontSize: 13, marginTop: 6 }}>{cvcError}</div> : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button type="submit" disabled={!stripe || loading || !cardHolder.trim()}>
          {loading ? 'Verarbeite...' : `Bezahlen ${((checkoutTotalCents || 0) / 100).toFixed(2)}€`}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div className="cart-line-price">
                    <div>Einzelpreis: {fmtPrice(i.priceCents)}€</div>
                    <div style={{color: 'var(--text-muted)', fontSize: 13}}>Steuer ({Math.round(TAX_RATE*100)}%): {fmtPrice(centsTax(i.priceCents))}€</div>
                  </div>
                  <button
                    onClick={() => { if (typeof onRemoveItem === 'function') onRemoveItem(k) }}
                    title="Aus dem Warenkorb entfernen"
                    aria-label="Aus dem Warenkorb entfernen"
                    style={{ background: 'transparent', border: 'none', color: '#b00020', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, padding: 6 }}
                  >
                    <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', fontSize: 16 }} aria-hidden>
                      🗑️
                    </span>
                  </button>
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

        {orderId && paymentMethod === "stripe" && (
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
              billingName={billingName}
            />
          </Elements>
        )}

        {orderId && paymentMethod === "paypal" && (
          <div style={{ marginTop: 12 }}>
            <div id="paypal-buttons" />
            <PayPalRenderer amountCents={checkoutTotalCents || 0} onSuccess={() => { onPaymentSuccess(); onClose() }} />
          </div>
        )}

        {!orderId && (
          <div style={{marginTop:20}}>
            <CheckoutForm
              cart={cart}
              cartTotalCents={grandTotal}
              onOrderCreated={(p) => {
                // propagate to parent if provided
                if (typeof onOrderCreated === "function") onOrderCreated(p)
              }}
              onError={(e) => console.error("CheckoutForm error", e)}
            />
            <div style={{ marginTop: 8 }}>
              <button onClick={onClose} style={{marginLeft:10}} disabled={isLoading}>Schließen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}