import { defineMiddlewares } from "@medusajs/framework/http"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Globale CORS-Middleware, die vor allen anderen Middlewares läuft
function corsMiddleware(req: MedusaRequest, res: MedusaResponse, next: () => void) {
  // Setze CORS-Header für alle Requests
  res.header("Access-Control-Allow-Origin", "http://localhost:3000")
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
  res.header("Access-Control-Allow-Credentials", "true")

  // OPTIONS-Requests sofort mit 200 OK beantworten
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      middlewares: [corsMiddleware],
    },
  ],
})
