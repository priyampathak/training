"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import connectDB from "@/src/lib/db";
import Plan from "@/src/models/Plan";
import { getSession } from "./auth";

// Validation Schema
const createPlanSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters"),
  features: z.array(z.string().min(1, "Feature cannot be empty")).min(1, "At least one feature is required"),
  usersLimit: z.number().min(1, "Users limit must be at least 1"),
  price: z.number().min(0, "Price cannot be negative"),
});

const updatePlanSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters").optional(),
  features: z.array(z.string().min(1, "Feature cannot be empty")).min(1, "At least one feature is required").optional(),
  usersLimit: z.number().min(1, "Users limit must be at least 1").optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  isActive: z.boolean().optional(),
});

interface PlanResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET ALL PLANS (Super Admin Only)
 */
export async function getAllPlans(): Promise<PlanResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    const plans = await Plan.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Plans fetched successfully",
      data: plans.map(plan => ({
        ...plan,
        _id: plan._id.toString(),
      })),
    };
  } catch (error) {
    console.error("Get plans error:", error);
    return {
      success: false,
      message: "An error occurred while fetching plans",
    };
  }
}

/**
 * CREATE PLAN (Super Admin Only)
 */
export async function createPlan(
  data: z.infer<typeof createPlanSchema>
): Promise<PlanResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate input
    const validation = createPlanSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    await connectDB();

    // Check if plan name already exists
    const existingPlan = await Plan.findOne({ name: data.name, isDeleted: false });
    if (existingPlan) {
      return {
        success: false,
        message: "Plan with this name already exists",
      };
    }

    // Create plan
    const plan = await Plan.create({
      name: data.name,
      features: data.features,
      usersLimit: data.usersLimit,
      price: data.price,
      isActive: true,
      isDeleted: false,
    });

    revalidatePath("/dashboard/admin/plans");

    return {
      success: true,
      message: "Plan created successfully",
      data: {
        planId: plan._id.toString(),
        name: plan.name,
      },
    };
  } catch (error) {
    console.error("Create plan error:", error);
    return {
      success: false,
      message: "An error occurred while creating the plan",
    };
  }
}

/**
 * UPDATE PLAN (Super Admin Only)
 */
export async function updatePlan(
  planId: string,
  data: z.infer<typeof updatePlanSchema>
): Promise<PlanResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate input
    const validation = updatePlanSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    await connectDB();

    // Check if plan name already exists (if name is being updated)
    if (data.name) {
      const existingPlan = await Plan.findOne({
        name: data.name,
        isDeleted: false,
        _id: { $ne: planId },
      });
      if (existingPlan) {
        return {
          success: false,
          message: "Plan with this name already exists",
        };
      }
    }

    // Update plan
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      { $set: data },
      { new: true }
    );

    if (!updatedPlan) {
      return {
        success: false,
        message: "Plan not found",
      };
    }

    revalidatePath("/dashboard/admin/plans");

    return {
      success: true,
      message: "Plan updated successfully",
      data: {
        planId: updatedPlan._id.toString(),
        name: updatedPlan.name,
      },
    };
  } catch (error) {
    console.error("Update plan error:", error);
    return {
      success: false,
      message: "An error occurred while updating the plan",
    };
  }
}

/**
 * DELETE PLAN (Soft Delete - Super Admin Only)
 */
export async function deletePlan(planId: string): Promise<PlanResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    await connectDB();

    // Soft delete plan
    await Plan.findByIdAndUpdate(planId, {
      isDeleted: true,
      isActive: false,
    });

    revalidatePath("/dashboard/admin/plans");

    return {
      success: true,
      message: "Plan deleted successfully",
    };
  } catch (error) {
    console.error("Delete plan error:", error);
    return {
      success: false,
      message: "An error occurred while deleting plan",
    };
  }
}

/**
 * TOGGLE PLAN ACTIVE STATUS (Super Admin Only)
 */
export async function togglePlanStatus(planId: string, isActive: boolean): Promise<PlanResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    await connectDB();

    await Plan.findByIdAndUpdate(planId, {
      isActive,
    });

    revalidatePath("/dashboard/admin/plans");

    return {
      success: true,
      message: `Plan ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.error("Toggle plan status error:", error);
    return {
      success: false,
      message: "An error occurred while updating plan status",
    };
  }
}

