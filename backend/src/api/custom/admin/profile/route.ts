import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAuth, AuthenticatedRequest } from "../../../middlewares/auth"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAuth(req as AuthenticatedRequest, res)
  if (!authed) return

  const authReq = req as AuthenticatedRequest
  const userId = authReq.user?.id

  if (!userId) {
    return res.status(401).json({ message: "no user id" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["roles"]
    } as any)

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    return res.json({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      roles: (user.roles || []).map((r: any) => r.name)
    })
  } catch (err: any) {
    console.error("[admin/profile GET] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAuth(req as AuthenticatedRequest, res)
  if (!authed) return

  const authReq = req as AuthenticatedRequest
  const userId = authReq.user?.id

  if (!userId) {
    return res.status(401).json({ message: "no user id" })
  }

  const { display_name } = req.body as any

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    const userRepo = AppDataSource.getRepository(User)
    
    await userRepo.update({ id: userId }, {
      displayName: display_name || null
    })

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["roles"]
    } as any)

    return res.json({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      roles: (user.roles || []).map((r: any) => r.name)
    })
  } catch (err: any) {
    console.error("[admin/profile PATCH] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
