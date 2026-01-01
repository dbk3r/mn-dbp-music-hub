import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureDataSource, setAdminCors } from "../_utils"

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)
  return res.sendStatus(200)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  setAdminCors(res)

  const ds = await ensureDataSource()

  try {
    const rows = await ds.query(
      `select id, email, first_name, last_name, created_at
       from customer
       order by created_at desc
       limit 200`
    )

    return res.json({ items: rows })
  } catch {
    const rows = await ds.query(
      `select id
       from customer
       order by id desc
       limit 200`
    )

    const items = rows.map((r: any) => ({ id: String(r.id), email: "" }))
    return res.json({ items })
  }
}
