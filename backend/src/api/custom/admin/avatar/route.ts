import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireAuth, AuthenticatedRequest } from "../../../middlewares/auth"
import { AppDataSource } from "../../../../datasource/data-source"
import { User } from "../../../../models/user"
import multer from "multer"
import path from "path"
import { randomBytes } from "crypto"
import fs from "fs"

const uploadDir = path.join(process.cwd(), "uploads", "avatars")

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${randomBytes(8).toString("hex")}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, WEBP allowed."))
    }
  },
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  const authed = await requireAuth(req as AuthenticatedRequest, res)
  if (!authed) return

  const authReq = req as AuthenticatedRequest
  const userId = authReq.user?.id

  if (!userId) {
    return res.status(401).json({ message: "no user id" })
  }

  // Process upload
  await new Promise<void>((resolve, reject) => {
    upload.single("avatar")(req as any, res as any, (err: any) => {
      if (err) reject(err)
      else resolve()
    })
  }).catch((err) => {
    return res.status(400).json({ message: err.message || "Upload failed" })
  })

  const file = (req as any).file
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({ where: { id: userId } } as any)

    if (!user) {
      // Clean up uploaded file
      fs.unlinkSync(file.path)
      return res.status(404).json({ message: "user not found" })
    }

    // Delete old avatar if exists
    if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), user.avatarUrl)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    // Update user with new avatar path
    const avatarPath = `/uploads/avatars/${file.filename}`
    await userRepo.update({ id: userId }, { avatarUrl: avatarPath })

    return res.json({
      message: "Avatar uploaded successfully",
      avatar_url: avatarPath,
    })
  } catch (err: any) {
    // Clean up uploaded file on error
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }
    console.error("[admin/avatar POST] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "DELETE, OPTIONS")
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
    const user = await userRepo.findOne({ where: { id: userId } } as any)

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    // Delete avatar file if exists
    if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
      const filePath = path.join(process.cwd(), user.avatarUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Clear avatar URL in database
    await userRepo.update({ id: userId }, { avatarUrl: null })

    return res.json({ message: "Avatar deleted successfully" })
  } catch (err: any) {
    console.error("[admin/avatar DELETE] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
