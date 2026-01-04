import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"
import { AppDataSource } from "../../../../datasource/data-source"
import { Order, OrderStatus } from "../../../../models/order"
import { setStoreCors } from "../../audio/_cors"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  setStoreCors(req, res)

  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent((req as any).rawBody || req.body, sig, endpointSecret)
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const orderRepo = AppDataSource.getRepository(Order)

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata.order_id

      if (orderId) {
        const order = await orderRepo.findOne({ where: { id: Number(orderId) } as any })
        if (order && order.status === OrderStatus.PENDING) {
          order.status = OrderStatus.PAID
          await orderRepo.save(order)
          console.log(`Order ${orderId} marked as paid`)
        }
      }
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      const failedOrderId = failedPayment.metadata.order_id

      if (failedOrderId) {
        const order = await orderRepo.findOne({ where: { id: Number(failedOrderId) } as any })
        if (order && order.status === OrderStatus.PENDING) {
          order.status = OrderStatus.CANCELLED
          await orderRepo.save(order)
          console.log(`Order ${failedOrderId} marked as cancelled`)
        }
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({ received: true })
}