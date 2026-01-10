import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DataSource } from "typeorm";

/**
 * PATCH /custom/admin/orders/:id/vendor-paid
 * Update vendor_paid status for an order
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = (req as any).params;
    const { vendor_paid } = (req as any).body;
    
    if (typeof vendor_paid !== "boolean") {
      return res.status(400).json({
        message: "vendor_paid must be a boolean",
      });
    }

    const dataSource: DataSource = (req as any).scope.resolve("datasource");
    
    // Get user ID from request (assuming auth middleware sets this)
    const userId = (req as any).auth?.actor_id || (req as any).user?.id || null;

    if (vendor_paid) {
      // Mark as paid
      await dataSource.query(
        `UPDATE orders 
         SET vendor_paid = true, 
             vendor_paid_at = NOW(), 
             vendor_paid_by = $1 
         WHERE id = $2`,
        [userId, id]
      );
    } else {
      // Mark as unpaid
      await dataSource.query(
        `UPDATE orders 
         SET vendor_paid = false, 
             vendor_paid_at = NULL, 
             vendor_paid_by = NULL 
         WHERE id = $1`,
        [id]
      );
    }

    // Fetch updated order
    const [order] = await dataSource.query(
      `SELECT id, "customerId", status, "totalPriceCents", "currencyCode", 
              items, "createdAt", vendor_paid, vendor_paid_at, vendor_paid_by
       FROM orders WHERE id = $1`,
      [id]
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({
      order: {
        id: order.id,
        customerId: order.customerId,
        status: order.status,
        totalPriceCents: order.totalPriceCents,
        currencyCode: order.currencyCode,
        items: order.items,
        createdAt: order.createdAt,
        vendor_paid: order.vendor_paid,
        vendor_paid_at: order.vendor_paid_at,
        vendor_paid_by: order.vendor_paid_by,
      },
      message: vendor_paid ? "Bestellung als bezahlt markiert" : "Bestellung als unbezahlt markiert",
    });
  } catch (error: any) {
    console.error("Error updating vendor_paid status:", error);
    return res.status(500).json({
      message: "Failed to update vendor_paid status",
      error: error.message,
    });
  }
};
