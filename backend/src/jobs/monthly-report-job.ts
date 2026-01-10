import { MedusaContainer } from "@medusajs/framework/types";
import { AppDataSource } from "../datasource/data-source";
import { sendMonthlyReport } from "../services/report-service";

export default async function monthlyReportJob({ container }: { container: MedusaContainer }) {
  // This is a scheduled job handler
  // Schedule is defined in config below
  try {
    console.log("[monthly-report-job] Starting scheduled monthly report");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get previous month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonth.getFullYear();
    const month = previousMonth.getMonth() + 1;

    await sendMonthlyReport(AppDataSource, year, month);

    console.log(`[monthly-report-job] Successfully sent monthly report for ${month}/${year}`);
  } catch (error) {
    console.error("[monthly-report-job] Failed to send monthly report:", error);
  }
}

export const config = {
  name: "monthly-report",
  schedule: "0 6 1 * *", // Run at 6:00 AM on the 1st day of every month
};
