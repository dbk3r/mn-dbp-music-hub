import { AppDataSource } from "../datasource/data-source"
import { SystemSetting } from "../models/system-setting"

export class SystemSettingsService {
  private settingRepo = AppDataSource.getRepository(SystemSetting)

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingRepo.findOne({ where: { key } })
    return setting?.value || null
  }

  async setSetting(key: string, value: string, description?: string): Promise<void> {
    let setting = await this.settingRepo.findOne({ where: { key } })

    if (setting) {
      setting.value = value
      if (description) setting.description = description
      await this.settingRepo.save(setting)
    } else {
      setting = this.settingRepo.create({
        key,
        value,
        description: description || key,
      })
      await this.settingRepo.save(setting)
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.settingRepo.find()
    const result: Record<string, string> = {}

    for (const setting of settings) {
      result[setting.key] = setting.value
    }

    return result
  }

  async getStripeSettings() {
    const [publishableKey, secretKey, webhookSecret] = await Promise.all([
      this.getSetting("stripe_publishable_key"),
      this.getSetting("stripe_secret_key"),
      this.getSetting("stripe_webhook_secret"),
    ])

    return {
      stripe_publishable_key: publishableKey || "",
      stripe_secret_key: secretKey || "",
      stripe_webhook_secret: webhookSecret || "",
    }
  }

  async setStripeSettings(publishableKey: string, secretKey: string, webhookSecret: string) {
    await Promise.all([
      this.setSetting("stripe_publishable_key", publishableKey, "Stripe Publishable Key für Frontend"),
      this.setSetting("stripe_secret_key", secretKey, "Stripe Secret Key für Backend"),
      this.setSetting("stripe_webhook_secret", webhookSecret, "Stripe Webhook Secret für Validierung"),
    ])
  }
}