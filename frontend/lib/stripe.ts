"use client"
import { loadStripe } from "@stripe/stripe-js"

let stripePromise: Promise<any | null> | null = null

export function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch("/api/config")
      .then((res) => res.json())
      .then((config) => {
        if (!config.stripe_publishable_key) {
          console.warn("Stripe publishable key not configured — payments disabled in UI")
          return null
        }
        return loadStripe(config.stripe_publishable_key)
      })
      .catch((err) => {
        console.warn("Failed to load Stripe config:", err)
        return null
      })
  }
  return stripePromise
}
