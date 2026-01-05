import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

export default async function run({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  // Use the request-style customer service instance (has create/retrieveByEmail)
  // Module APIs expose different shapes; resolve the runtime service by name.
  const customerService = container.resolve("customerService") as any
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  const testEmail = process.env.TEST_CUSTOMER_EMAIL || "test@example.com"
  const testPassword = process.env.TEST_CUSTOMER_PASSWORD || "password"

  logger.info("Ensuring test customer exists...")
  let customer = await customerService.retrieveByEmail(testEmail).catch(() => null)
  if (!customer) {
    customer = await customerService.create({
      email: testEmail,
      password: testPassword,
      first_name: "Test",
      last_name: "Customer",
    })
    logger.info(`Created test customer ${testEmail}`)
  } else {
    logger.info(`Test customer ${testEmail} already exists`)
  }

  logger.info("Ensuring publishable API key exists...")
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Test Web",
          type: "publishable",
          created_by: "seed-script",
        },
      ],
    },
  })

  const publishableApiKey = publishableApiKeyResult[0]

  // link to default sales channel
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" })
  if (!defaultSalesChannel.length) {
    logger.info("No Default Sales Channel found; skipping link.")
  } else {
    await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: publishableApiKey.id, add: [defaultSalesChannel[0].id] } })
    logger.info("Linked publishable API key to Default Sales Channel")
  }

  const pkAny = publishableApiKey as any
  logger.info(`Publishable key: ${pkAny.key || pkAny.public_key || pkAny.access_key || pkAny.token || pkAny.title}`)
}
