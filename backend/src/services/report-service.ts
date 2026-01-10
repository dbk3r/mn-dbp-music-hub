import nodemailer from "nodemailer";
import { DataSource } from "typeorm";
import { User } from "../models/user";
import { Role } from "../models/role";

interface VendorReportData {
  vendor_id: string;
  vendor_email: string;
  vendor_name: string;
  vendor_iban: string | null;
  order_count: number;
  product_count: number;
  total_revenue_cents: number;
  commission_cents: number;
  payout_cents: number;
}

/**
 * Send monthly report to all admins with payment instructions for vendors
 */
export async function sendMonthlyReport(
  dataSource: DataSource,
  year: number,
  month: number
): Promise<void> {
  console.log(`[report-service] Generating monthly report for ${month}/${year}`);

  // Get commission rate from settings
  let commissionRate = 10; // Default
  try {
    const settingRow = await dataSource.query(
      `SELECT value FROM setting WHERE key = $1 LIMIT 1`,
      ["commission_rate"]
    );
    if (settingRow && settingRow[0]) {
      commissionRate = parseFloat(settingRow[0].value || "10");
    }
  } catch (error) {
    console.error("[report-service] Failed to load commission rate, using default:", error);
  }

  // Query vendor statistics for the specified month
  const query = `
    SELECT 
      af.uploaded_by as vendor_id,
      u.email as vendor_email,
      COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as vendor_name,
      u.iban as vendor_iban,
      COUNT(DISTINCT o.id) as order_count,
      COUNT(item_data.audio_id) as product_count,
      SUM(item_data.price_cents) as total_revenue_cents,
      ROUND(SUM(item_data.price_cents) * $1 / 100) as commission_cents,
      SUM(item_data.price_cents) - ROUND(SUM(item_data.price_cents) * $1 / 100) as payout_cents
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
    WHERE o.status = 'paid'
      AND EXTRACT(YEAR FROM o.created_at) = $2
      AND EXTRACT(MONTH FROM o.created_at) = $3
    GROUP BY af.uploaded_by, u.email, u.first_name, u.last_name, u.iban
    ORDER BY total_revenue_cents DESC
  `;

  const vendorData: VendorReportData[] = await dataSource.query(query, [
    commissionRate / 100,
    year,
    month,
  ]);

  if (vendorData.length === 0) {
    console.log(`[report-service] No sales data for ${month}/${year}, skipping report`);
    return;
  }

  // Calculate totals
  const totals = {
    order_count: vendorData.reduce((sum, v) => sum + parseInt(String(v.order_count)), 0),
    product_count: vendorData.reduce((sum, v) => sum + parseInt(String(v.product_count)), 0),
    total_revenue_cents: vendorData.reduce((sum, v) => sum + parseInt(String(v.total_revenue_cents)), 0),
    commission_cents: vendorData.reduce((sum, v) => sum + parseInt(String(v.commission_cents)), 0),
    payout_cents: vendorData.reduce((sum, v) => sum + parseInt(String(v.payout_cents)), 0),
  };

  // Generate report HTML
  const reportHtml = generateReportHtml(vendorData, totals, year, month, commissionRate);

  // Get all admin users
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  
  const adminRole = await roleRepo.findOne({ where: { name: "admin" } });
  if (!adminRole) {
    throw new Error("Admin role not found");
  }

  const admins = await userRepo
    .createQueryBuilder("user")
    .innerJoin("user.roles", "role")
    .where("role.id = :roleId", { roleId: adminRole.id })
    .getMany();

  if (admins.length === 0) {
    console.log("[report-service] No admin users found");
    return;
  }

  // Send email to all admins
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";

  const monthName = new Date(year, month - 1, 1).toLocaleString("de-DE", { month: "long" });

  for (const admin of admins) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: admin.email,
        subject: `Monatsbericht ${monthName} ${year} - Vendor Auszahlungen`,
        html: reportHtml,
      });
      console.log(`[report-service] Report sent to ${admin.email}`);
    } catch (error) {
      console.error(`[report-service] Failed to send report to ${admin.email}:`, error);
    }
  }

  console.log(`[report-service] Monthly report for ${month}/${year} sent to ${admins.length} admins`);
}

/**
 * Generate HTML report
 */
function generateReportHtml(
  vendors: VendorReportData[],
  totals: any,
  year: number,
  month: number,
  commissionRate: number
): string {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const monthName = new Date(year, month - 1, 1).toLocaleString("de-DE", { month: "long" });

  let vendorRows = "";
  for (const vendor of vendors) {
    const ibanDisplay = vendor.vendor_iban || '<span style="color: #dc2626;">IBAN fehlt</span>';
    vendorRows += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px;">${escapeHtml(vendor.vendor_name)}</td>
        <td style="padding: 12px 8px;">${escapeHtml(vendor.vendor_email)}</td>
        <td style="padding: 12px 8px;">${ibanDisplay}</td>
        <td style="padding: 12px 8px; text-align: right;">${vendor.product_count}</td>
        <td style="padding: 12px 8px; text-align: right;">${vendor.order_count}</td>
        <td style="padding: 12px 8px; text-align: right;">${formatCurrency(parseInt(String(vendor.total_revenue_cents)))}</td>
        <td style="padding: 12px 8px; text-align: right;">${formatCurrency(parseInt(String(vendor.commission_cents)))}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #059669;">${formatCurrency(parseInt(String(vendor.payout_cents)))}</td>
      </tr>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monatsbericht ${monthName} ${year}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #3b82f6, #2563eb); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h1 style="margin: 0 0 10px 0; font-size: 28px;">Monatsbericht ${monthName} ${year}</h1>
    <p style="margin: 0; font-size: 16px; opacity: 0.9;">Vendor Auszahlungen und Statistiken</p>
  </div>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #1f2937;">Zusammenfassung</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Gesamtumsatz</div>
        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${formatCurrency(totals.total_revenue_cents)}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Provision (${commissionRate}%)</div>
        <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${formatCurrency(totals.commission_cents)}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Auszahlung an Vendors</div>
        <div style="font-size: 24px; font-weight: bold; color: #059669;">${formatCurrency(totals.payout_cents)}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Bestellungen</div>
        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${totals.order_count}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Verkaufte Produkte</div>
        <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${totals.product_count}</div>
      </div>
    </div>
  </div>

  <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="margin: 0; padding: 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 20px; color: #1f2937;">Zahlungsanweisungen</h2>
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Vendor</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">E-Mail</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">IBAN</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Produkte</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Bestellungen</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Umsatz</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Provision</th>
            <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Auszahlung</th>
          </tr>
        </thead>
        <tbody>
          ${vendorRows}
        </tbody>
        <tfoot>
          <tr style="background: #f9fafb; border-top: 2px solid #e5e7eb; font-weight: 600;">
            <td colspan="3" style="padding: 12px 8px;">Gesamt</td>
            <td style="padding: 12px 8px; text-align: right;">${totals.product_count}</td>
            <td style="padding: 12px 8px; text-align: right;">${totals.order_count}</td>
            <td style="padding: 12px 8px; text-align: right;">${formatCurrency(totals.total_revenue_cents)}</td>
            <td style="padding: 12px 8px; text-align: right;">${formatCurrency(totals.commission_cents)}</td>
            <td style="padding: 12px 8px; text-align: right; color: #059669;">${formatCurrency(totals.payout_cents)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
    <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Hinweise zur Auszahlung</h3>
    <ul style="margin: 0; padding-left: 20px; color: #92400e;">
      <li>Bitte prüfen Sie die IBAN-Angaben der Vendors vor der Überweisung</li>
      <li>Vendors ohne IBAN sind rot markiert - bitte IBAN nachfordern</li>
      <li>Die Provision von ${commissionRate}% wurde bereits abgezogen</li>
      <li>Verwendungszweck: "Auszahlung ${monthName} ${year} - Music Hub"</li>
    </ul>
  </div>

  <div style="margin-top: 30px; padding: 15px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0;">Dieser Report wurde automatisch generiert am ${new Date().toLocaleString("de-DE")}</p>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
