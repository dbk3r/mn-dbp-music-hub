import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AppDataSource } from "../../../../datasource/data-source"
import { LicenseTemplate } from "../../../../models/license-template"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const repo = AppDataSource.getRepository(LicenseTemplate)
    
    // Get the active template or the first one
    let template = await repo.findOne({ where: { isActive: true } as any })
    
    if (!template) {
      template = await repo.findOne({ where: {} as any })
    }

    if (!template) {
      // Create default template if none exists
      template = repo.create({
        templateHtml: `<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { max-width: 200px; margin-bottom: 20px; }
    .content { line-height: 1.6; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    {{LOGO}}
    <h1>Audio-Lizenz</h1>
  </div>
  <div class="content">
    <div class="field"><span class="label">Name:</span> {firstname} {lastname}</div>
    <div class="field"><span class="label">Adresse:</span> {street} {housenumber}, {zip} {city}</div>
    <div class="field"><span class="label">E-Mail:</span> {email}</div>
    <div class="field"><span class="label">Audio-Titel:</span> {audio_title}</div>
    <div class="field"><span class="label">Lizenzmodell:</span> {license_model}</div>
    <div class="field"><span class="label">Lizenzbeschreibung:</span> {license_description}</div>
    <div class="field"><span class="label">Bestellnummer:</span> {order_id}</div>
    <div class="field"><span class="label">Kaufdatum:</span> {purchase_date}</div>
  </div>
</body>
</html>`,
        isActive: true
      })
      await repo.save(template)
    }

    res.status(200).json(template)
  } catch (err) {
    console.error("[license-template] GET Error:", err)
    res.status(500).json({ message: "Fehler beim Laden des Templates" })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  try {
    const body = req.body as any
    const { template_html, logo_position } = body

    const repo = AppDataSource.getRepository(LicenseTemplate)
    
    let template = await repo.findOne({ where: { isActive: true } as any })
    
    if (!template) {
      template = repo.create({ isActive: true })
    }

    if (template_html !== undefined) {
      template.templateHtml = template_html
    }
    if (logo_position !== undefined) {
      template.logoPosition = logo_position
    }

    await repo.save(template)

    res.status(200).json(template)
  } catch (err) {
    console.error("[license-template] PUT Error:", err)
    res.status(500).json({ message: "Fehler beim Speichern des Templates" })
  }
}
