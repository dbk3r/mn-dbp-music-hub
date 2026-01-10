import type { MedusaContainer } from "@medusajs/framework/types";

export default async function jobsLoader({ container }: { container: MedusaContainer }) {
  console.log("[jobs-loader] Jobs are automatically loaded by Medusa from /jobs directory");
  // Note: Scheduled jobs in src/jobs/ are automatically loaded by Medusa 2.x
  // No manual setup needed - jobs with config.schedule will be registered automatically
}
