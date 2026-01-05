import { AppDataSource } from "../datasource/data-source"
import { SystemSettingsService } from "../services/system-settings-service"

async function run() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const svc = new SystemSettingsService()

  // Defaults
  await svc.setSetting("shop_tax_rate", "0.19", "Standard-Steuersatz (dezimal)")
  await svc.setSetting("shop_display_tax_breakdown", "true", "Steueraufteilung im Warenkorb anzeigen")
  await svc.setSetting("shop_show_prices_with_tax", "false", "Preise inklusive Steuer anzeigen")

  console.log("Seeded default shop settings")
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
