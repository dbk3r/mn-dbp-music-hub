import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../datasource/data-source"
import jwt from "jsonwebtoken"

async function auth(req: MedusaRequest) {
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
  const serviceKey = process.env.BACKEND_SERVICE_KEY
  const authHeader = (req.headers.authorization || "") as string
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("unauthorized")
  const bearer = authHeader.slice(7)
  if (serviceKey) {
    try {
      const decoded = jwt.verify(bearer, serviceKey, { algorithms: ["HS256"] }) as any
      if (decoded && decoded.service === "admin") return true
    } catch (e) {
      // ignore
    }
  }
  // fallback to JWT_SECRET
  jwt.verify(bearer, JWT_SECRET)
  return true
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    await auth(req)
  } catch (e:any) {
    return res.status(401).json({ message: 'unauthorized' })
  }
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize()
    } catch (err:any) {
      console.error('Failed to initialize AppDataSource in PATCH /custom/admin/orders/:id', err)
      return res.status(500).json({ message: 'database not initialized' })
    }
  }
  let id = (req.params as any).id
  if (!id) return res.status(400).json({ message: 'missing id' })
  // normalize `order_123` -> `123`
  if (typeof id === 'string' && id.startsWith('order_')) id = id.replace(/^order_/, '')
  let body: any = null
  try {
    body = req.body || JSON.parse(await (async ()=>{ const chunks:any[]=[]; for await (const c of req as any) chunks.push(Buffer.isBuffer(c)?c:Buffer.from(c)); return Buffer.concat(chunks).toString(); })())
  } catch (e) {
    // ignore
  }
  try {
    const updates: string[] = []
    const params: any[] = []
    if (body?.status != null) {
      updates.push('status = $' + (params.length+1)); params.push(body.status)
    }
    if (body?.totalPriceCents != null) { updates.push('"totalPriceCents" = $' + (params.length+1)); params.push(Number(body.totalPriceCents)) }
    if (body?.currencyCode != null) { updates.push('"currencyCode" = $' + (params.length+1)); params.push(body.currencyCode) }
    if (body?.items != null) { updates.push('items = $' + (params.length+1)); params.push(JSON.stringify(body.items)) }

    if (updates.length) {
      params.push(id)
      const q = `UPDATE orders SET ${updates.join(', ')} , "updatedAt" = now() WHERE id::text = $${params.length} OR order_id = $${params.length}`
      await AppDataSource.query(q, params)
    }

    // handle customer update if provided
    if (body?.customer_email) {
      try {
        const rows:any[] = await AppDataSource.query('SELECT "customerId" FROM orders WHERE id = $1 LIMIT 1', [id])
        const custId = rows && rows[0] ? rows[0].customerId : null
        if (custId) {
          await AppDataSource.query('UPDATE customer SET email = $1, first_name = $2, last_name = $3 WHERE id = $4', [body.customer_email, body.customer_first_name || '', body.customer_last_name || '', custId])
        }
      } catch (e) {
        // ignore
      }
    }

    return res.json({ message: 'updated' })
  } catch (err:any) {
    return res.status(500).json({ message: String(err) })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    await auth(req)
  } catch (e:any) {
    return res.status(401).json({ message: 'unauthorized' })
  }
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize()
    } catch (err:any) {
      console.error('Failed to initialize AppDataSource in DELETE /custom/admin/orders/:id', err)
      return res.status(500).json({ message: 'database not initialized' })
    }
  }
  const id = (req.params as any).id
  if (!id) return res.status(400).json({ message: 'missing id' })
  
  try {
    // Get order to find associated files
    const orderRows: any[] = await AppDataSource.query(
      'SELECT order_id FROM orders WHERE id::text = $1 OR order_id = $1',
      [id]
    )
    const orderId = orderRows[0]?.order_id
    
    if (orderId) {
      // Find all PDF files for this order
      const fs = require('fs')
      const path = require('path')
      const uploadsDir = path.join(process.cwd(), 'uploads', 'variants')
      
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir)
        // Filter files that belong to this order: license-{order_id}-...
        const orderFiles = files.filter((file: string) => 
          file.startsWith(`license-${orderId}-`) && file.endsWith('.pdf')
        )
        
        for (const filename of orderFiles) {
          // Check if this file is referenced in audio_variant_file table
          const refRows: any[] = await AppDataSource.query(
            'SELECT id FROM audio_variant_file WHERE filename = $1',
            [filename]
          )
          
          // If file is not referenced anywhere, delete it
          if (refRows.length === 0) {
            const filePath = path.join(uploadsDir, filename)
            try {
              fs.unlinkSync(filePath)
              console.log(`[DELETE Order] Removed unreferenced file: ${filename}`)
            } catch (fileErr) {
              console.error(`[DELETE Order] Failed to delete file ${filename}:`, fileErr)
            }
          } else {
            console.log(`[DELETE Order] Keeping file ${filename} (still referenced)`)
          }
        }
      }
    }
    
    // Delete the order from database
    await AppDataSource.query('DELETE FROM orders WHERE id::text = $1 OR order_id = $1', [id])
    return res.json({ message: 'deleted' })
  } catch (err:any) {
    return res.status(500).json({ message: String(err) })
  }
}
