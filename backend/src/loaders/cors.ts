import type { MedusaContainer } from "@medusajs/framework/types"

export default async function corsLoader({ container }: { container: MedusaContainer }) {
  // Hole die Express-App-Instanz
  const app = container.resolve("app") as any
  
  // Registriere globale CORS-Middleware vor allen anderen Middlewares
  app.use((req: any, res: any, next: any) => {
    // Setze CORS-Header für alle /store-Requests
    if (req.path?.startsWith('/store')) {
      res.header("Access-Control-Allow-Origin", process.env.STORE_CORS || "http://localhost:3000")
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization")
      res.header("Access-Control-Allow-Credentials", "true")
      
      // OPTIONS-Requests sofort mit 200 OK beantworten
      if (req.method === "OPTIONS") {
        return res.status(200).end()
      }
    }
    next()
  })
}
