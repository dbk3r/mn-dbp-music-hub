"use client"
import { loadStripe } from "@stripe/stripe-js"

let stripePromise: Promise<any> | null = null

export function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch("/api/config")
      .then((res) => res.json())
      .then((config) => {
        if (!config.stripe_publishable_key) {
          throw new Error("Stripe publishable key not configured")
        }
        return loadStripe(config.stripe_publishable_key)
      })
  }
  return stripePromise
}
