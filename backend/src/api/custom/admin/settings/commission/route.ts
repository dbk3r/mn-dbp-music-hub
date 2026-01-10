import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/utils";

/**
 * GET /custom/admin/settings/commission
 * Returns the platform commission rate (percentage)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const settingsModule = (req as any).scope.resolve("settingsModuleService");
    
    let commissionRate = await settingsModule.retrieve("commission_rate");
    
    // Default to 10% if not set
    if (!commissionRate) {
      commissionRate = { key: "commission_rate", value: "10" };
    }
    
    return res.json({
      commission_rate: parseFloat(commissionRate.value || "10"),
    });
  } catch (error: any) {
    console.error("Error fetching commission rate:", error);
    return res.status(500).json({
      message: "Failed to fetch commission rate",
      error: error.message,
    });
  }
};

/**
 * PATCH /custom/admin/settings/commission
 * Updates the platform commission rate
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { commission_rate } = (req as any).body;

    if (typeof commission_rate !== "number" || commission_rate < 0 || commission_rate > 100) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Commission rate must be a number between 0 and 100"
      );
    }

    const settingsModule = (req as any).scope.resolve("settingsModuleService");
    
    try {
      await settingsModule.retrieve("commission_rate");
      await settingsModule.update("commission_rate", {
        value: commission_rate.toString(),
      });
    } catch {
      // Setting doesn't exist, create it
      await settingsModule.create({
        key: "commission_rate",
        value: commission_rate.toString(),
      });
    }

    return res.json({
      commission_rate,
      message: "Commission rate updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating commission rate:", error);
    
    if (error instanceof MedusaError) {
      return res.status(400).json({
        message: error.message,
      });
    }
    
    return res.status(500).json({
      message: "Failed to update commission rate",
      error: error.message,
    });
  }
};
