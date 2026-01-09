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
  const [paymentMethodsAvailable, setPaymentMethodsAvailable] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(true)
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address1, setAddress1] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [countryCode, setCountryCode] = useState("DE")
  const [profileLoaded, setProfileLoaded] = useState(false)
  
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
    
    // Load user profile
    const token = localStorage.getItem('user_token')
    if (token) {
      fetch('/custom/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          setFirstName(data.first_name || "")
          setLastName(data.last_name || "")
          setAddress1(data.address?.address_1 || "")
          setCity(data.address?.city || "")
          setPostalCode(data.address?.postal_code || "")
          setCountryCode(data.address?.country_code || "DE")
          setProfileLoaded(true)
        })
        .catch(() => setProfileLoaded(true))
    } else {
      setProfileLoaded(true)
    }
  }, [])

  useEffect(() => {
    // Check if payment methods are available
    async function checkPaymentMethods() {
      try {
        const stripePromise = getStripePromise()
        const stripe = await stripePromise
        setPaymentMethodsAvailable(!!stripe)
      } catch (e) {
        setPaymentMethodsAvailable(false)
      } finally {
        setCheckingPayment(false)
      }
    }
    checkPaymentMethods()
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

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !address1.trim() || !city.trim() || !postalCode.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    try {
      const r = await fetch('/custom/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          items: cart.map(c => ({ audio_id: c.audioId, license_model_id: c.licenseModelId })),
          billing_address: {
            first_name: firstName,
            last_name: lastName,
            address_1: address1,
            city: city,
            postal_code: postalCode,
            country_code: countryCode
          }
        }),
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
          {/* Billing Address Form */}
          <div style={{ border: '1px solid #eee', padding: 20, borderRadius: 8, marginBottom: 20, background: '#f9f9f9' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Rechnungsadresse</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Vorname *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Nachname *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Straße und Hausnummer *</label>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                required
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>PLZ *</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Ort *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 600 }}>Land *</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
              >
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
                <option value="US">USA</option>
                <option value="GB">Vereinigtes Königreich</option>
              </select>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Bestellübersicht</h2>
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
              {!paymentMethodsAvailable && !checkingPayment && (
                <div style={{ padding: 12, background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, marginBottom: 12 }}>
                  ⚠️ Keine Zahlungsmethode konfiguriert. Bitte kontaktieren Sie den Administrator.
                </div>
              )}
              <button 
                onClick={createOrder}
                disabled={!paymentMethodsAvailable || checkingPayment}
                style={{ opacity: (!paymentMethodsAvailable || checkingPayment) ? 0.5 : 1 }}
              >
                {checkingPayment ? 'Prüfe Zahlungsmethoden...' : 'Bestellung erstellen und bezahlen'}
              </button>
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
