import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../datasource/data-source"
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

  // Extract customer_id from JWT
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" })
  }

  const token = authHeader.replace("Bearer ", "")
  const jwt = require("jsonwebtoken")
  let decoded: any

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret")
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const customerId = decoded.customer_id
  if (!customerId) {
    return res.status(401).json({ message: "no customer id in token" })
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
    // Check if customer exists and get current avatar
    const result = await AppDataSource.query(
      `SELECT avatar_url FROM customer WHERE id = $1`,
      [customerId]
    )

    if (result.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(file.path)
      return res.status(404).json({ message: "customer not found" })
    }

    const oldAvatarUrl = result[0].avatar_url

    // Delete old avatar if exists
    if (oldAvatarUrl && oldAvatarUrl.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), oldAvatarUrl)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    // Update customer with new avatar path
    const avatarPath = `/uploads/avatars/${file.filename}`
    await AppDataSource.query(
      `UPDATE customer SET avatar_url = $1 WHERE id = $2`,
      [avatarPath, customerId]
    )

    return res.json({
      message: "Avatar uploaded successfully",
      avatar_url: avatarPath,
    })
  } catch (err: any) {
    // Clean up uploaded file on error
    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }
    console.error("[avatar POST] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  // Extract customer_id from JWT
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" })
  }

  const token = authHeader.replace("Bearer ", "")
  const jwt = require("jsonwebtoken")
  let decoded: any

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret")
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const customerId = decoded.customer_id
  if (!customerId) {
    return res.status(401).json({ message: "no customer id in token" })
  }

  if (!AppDataSource.isInitialized) await AppDataSource.initialize()

  try {
    // Get current avatar
    const result = await AppDataSource.query(
      `SELECT avatar_url FROM customer WHERE id = $1`,
      [customerId]
    )

    if (result.length === 0) {
      return res.status(404).json({ message: "customer not found" })
    }

    const avatarUrl = result[0].avatar_url

    // Delete avatar file if exists
    if (avatarUrl && avatarUrl.startsWith("/uploads/avatars/")) {
      const filePath = path.join(process.cwd(), avatarUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    // Clear avatar URL in database
    await AppDataSource.query(
      `UPDATE customer SET avatar_url = NULL WHERE id = $1`,
      [customerId]
    )

    return res.json({ message: "Avatar deleted successfully" })
  } catch (err: any) {
    console.error("[avatar DELETE] error:", err)
    return res.status(500).json({ message: String(err.message || err) })
  }
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return res.status(204).send("")
}
