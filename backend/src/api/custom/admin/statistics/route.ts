import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DataSource } from "typeorm";

/**
 * GET /custom/admin/statistics
 * Returns order statistics grouped by vendor with filters
 * Query params: year, month, vendor_id
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { year, month, vendor_id } = req.query;
    const dataSource: DataSource = (req as any).scope.resolve("datasource");
    const settingsModule = (req as any).scope.resolve("settingsModuleService");

    // Get commission rate
    let commissionRate = 10; // Default
    try {
      const setting = await settingsModule.retrieve("commission_rate");
      commissionRate = parseFloat(setting.value || "10");
    } catch {
      // Use default
    }

    // Build WHERE conditions
    const conditions: string[] = ["o.status = 'paid'"];
    const params: any = {};

    if (year) {
      conditions.push("EXTRACT(YEAR FROM o.created_at) = :year");
      params.year = parseInt(year as string);
    }

    if (month) {
      conditions.push("EXTRACT(MONTH FROM o.created_at) = :month");
      params.month = parseInt(month as string);
    }

    if (vendor_id) {
      conditions.push("af.uploaded_by = :vendorId");
      params.vendorId = vendor_id;
    }

    const whereClause = conditions.join(" AND ");

    // Query to get statistics per vendor
    const query = `
      SELECT 
        af.uploaded_by as vendor_id,
        u.email as vendor_email,
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as vendor_name,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(item_data.audio_id) as product_count,
        SUM(item_data.price_cents) as total_revenue_cents,
        ROUND(SUM(item_data.price_cents) * :commissionRate / 100) as commission_cents,
        SUM(item_data.price_cents) - ROUND(SUM(item_data.price_cents) * :commissionRate / 100) as payout_cents,
        COUNT(DISTINCT o.id) FILTER (WHERE o.vendor_paid = true) as paid_order_count,
        COUNT(DISTINCT o.id) FILTER (WHERE o.vendor_paid = false) as unpaid_order_count
      FROM orders o
      CROSS JOIN LATERAL jsonb_to_recordset(o.items) as item_data(
        audio_id int,
        title text,
        license_model_id int,
        license_model_name text,
        price_cents int
      )
      LEFT JOIN audio_file af ON af.id = item_data.audio_id
      LEFT JOIN "user" u ON u.id = af.uploaded_by
      WHERE ${whereClause}
      GROUP BY af.uploaded_by, u.email, u.first_name, u.last_name
      ORDER BY total_revenue_cents DESC
    `;

    const result = await dataSource.query(query, {
      ...params,
      commissionRate: commissionRate / 100,
    });

    // Format results
    const statistics = result.map((row: any) => ({
      vendor_id: row.vendor_id,
      vendor_email: row.vendor_email,
      vendor_name: row.vendor_name?.trim() || row.vendor_email,
      order_count: parseInt(row.order_count),
      product_count: parseInt(row.product_count),
      total_revenue_cents: parseInt(row.total_revenue_cents),
      commission_cents: parseInt(row.commission_cents),
      payout_cents: parseInt(row.payout_cents),
      currency_code: "EUR",
      paid_order_count: parseInt(row.paid_order_count || 0),
      unpaid_order_count: parseInt(row.unpaid_order_count || 0),
    }));

    // Calculate totals
    const totals = {
      order_count: statistics.reduce((sum: number, s: any) => sum + s.order_count, 0),
      product_count: statistics.reduce((sum: number, s: any) => sum + s.product_count, 0),
      total_revenue_cents: statistics.reduce((sum: number, s: any) => sum + s.total_revenue_cents, 0),
      commission_cents: statistics.reduce((sum: number, s: any) => sum + s.commission_cents, 0),
      payout_cents: statistics.reduce((sum: number, s: any) => sum + s.payout_cents, 0),
    };

    return res.json({
      statistics,
      totals,
      commission_rate: commissionRate,
      filters: {
        year: year ? parseInt(year as string) : null,
        month: month ? parseInt(month as string) : null,
        vendor_id: vendor_id || null,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};
