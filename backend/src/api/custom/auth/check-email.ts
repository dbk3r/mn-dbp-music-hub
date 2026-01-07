import type { Request, Response } from "express"
import { AppDataSource } from "../../../datasource/data-source"
import { User } from "../../../models/user"

export async function OPTIONS(req: Request, res: Response) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")
  return res.sendStatus(200)
}

export async function POST(req: Request, res: Response) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")

  const { email } = (req as any).body || {}
  if (!email) return res.status(400).json({ message: "email required" })

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()
  const repo = AppDataSource.getRepository(User)
  const user = await repo.findOne({ where: { email } } as any)
  return res.json({ exists: !!user })
}

export {}
