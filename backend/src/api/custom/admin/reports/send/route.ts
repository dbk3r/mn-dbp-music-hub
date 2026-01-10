import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DataSource } from "typeorm";
import { sendMonthlyReport } from "../../../../../services/report-service";

/**
 * POST /custom/admin/reports/send
 * Manually trigger monthly report to all admins
 * Query params: year, month (optional - defaults to previous month)
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { year, month } = (req as any).query;
    
    // Default to previous month if not specified
    const now = new Date();
    const targetDate = new Date(
      year ? parseInt(year as string) : now.getFullYear(),
      month ? parseInt(month as string) - 1 : now.getMonth() - 1,
      1
    );
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    const dataSource: DataSource = (req as any).scope.resolve("datasource");
    
    // Send the report
    await sendMonthlyReport(dataSource, targetYear, targetMonth);

    return res.json({
      success: true,
      message: `Report für ${targetMonth}/${targetYear} wurde an alle Admins versendet`,
      year: targetYear,
      month: targetMonth,
    });
  } catch (error: any) {
    console.error("Error sending monthly report:", error);
    return res.status(500).json({
      success: false,
      message: "Fehler beim Versenden des Reports",
      error: error.message,
    });
  }
};
