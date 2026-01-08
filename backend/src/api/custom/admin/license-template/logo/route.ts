import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../../datasource/data-source"
import { LicenseTemplate } from "../../../../../models/license-template"
import formidable from "formidable"
import fs from "fs"
import path from "path"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const uploadDir = path.join(process.cwd(), "uploads", "license-logos")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext) => {
        return `logo-${Date.now()}${ext}`
      }
    })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("[license-template/logo] Upload error:", err)
        return res.status(500).json({ message: "Upload-Fehler" })
      }

      const fileArray = Array.isArray(files.file) ? files.file : files.file ? [files.file] : []
      const file = fileArray[0]

      if (!file) {
        return res.status(400).json({ message: "Keine Datei hochgeladen" })
      }

      const filename = path.basename(file.filepath)

      // Update template with logo filename
      const repo = AppDataSource.getRepository(LicenseTemplate)
      let template = await repo.findOne({ where: { isActive: true } as any })
      
      if (!template) {
        template = repo.create({ isActive: true })
      }

      // Delete old logo if exists
      if (template.logoFilename) {
        const oldPath = path.join(uploadDir, template.logoFilename)
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath)
        }
      }

      template.logoFilename = filename
      await repo.save(template)

      res.status(200).json({ filename, url: `/custom/uploads/license-logos/${filename}` })
    })
  } catch (err) {
    console.error("[license-template/logo] Error:", err)
    res.status(500).json({ message: "Fehler beim Logo-Upload" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const repo = AppDataSource.getRepository(LicenseTemplate)
    const template = await repo.findOne({ where: { isActive: true } as any })

    if (!template || !template.logoFilename) {
      return res.status(404).json({ message: "Kein Logo vorhanden" })
    }

    const logoPath = path.join(process.cwd(), "uploads", "license-logos", template.logoFilename)
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath)
    }

    template.logoFilename = undefined
    await repo.save(template)

    res.status(200).json({ message: "Logo gelöscht" })
  } catch (err) {
    console.error("[license-template/logo] DELETE Error:", err)
    res.status(500).json({ message: "Fehler beim Löschen des Logos" })
  }
}
