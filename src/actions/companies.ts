"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/db";
import Company from "@/src/models/Company";
import User from "@/src/models/User";
import { getSession } from "./auth";

// Validation Schema
const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid email address"),
  planId: z.string().min(1, "Plan ID is required"),
  adminUserId: z.string().min(1, "Admin user ID is required"),
});

interface CompanyResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET ALL COMPANIES (Super Admin Only)
 */
export async function getAllCompanies(): Promise<CompanyResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    // Fetch all companies with user counts
    const companies = await Company.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    // Get user counts and admin info for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const userCount = await User.countDocuments({
          companyId: company._id,
        });

        const activeUserCount = await User.countDocuments({
          companyId: company._id,
          isActive: true,
        });

        // Get company admin
        const admin = await User.findOne({
          companyId: company._id,
          role: "COMPANY_ADMIN",
        }).select("name email");

        return {
          ...company,
          _id: company._id.toString(),
          subscription: {
            ...company.subscription,
            planId: company.subscription.planId?.toString() || null,
          },
          userCount,
          activeUserCount,
          adminName: admin?.name || "No Admin",
          adminEmail: admin?.email || "",
        };
      })
    );

    return {
      success: true,
      message: "Companies fetched successfully",
      data: companiesWithCounts,
    };
  } catch (error) {
    console.error("Get companies error:", error);
    return {
      success: false,
      message: "An error occurred while fetching companies",
    };
  }
}

/**
 * SEARCH USER BY EMAIL (Super Admin Only)
 */
export async function searchUserByEmail(email: string): Promise<CompanyResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("_id name email designation companyId role");

    if (!user) {
      return {
        success: false,
        message: "User not found with this email",
      };
    }

    // Only Admin role users can be assigned as company admin
    if (user.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: `Only users with Admin role can be assigned as company admin. This user has role: ${user.role}`,
      };
    }

    // Check if user already has a company
    if (user.companyId) {
      return {
        success: false,
        message: "This user is already assigned to a company",
      };
    }

    return {
      success: true,
      message: "User found",
      data: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        designation: user.designation,
      },
    };
  } catch (error) {
    console.error("Search user error:", error);
    return {
      success: false,
      message: "An error occurred while searching for user",
    };
  }
}

/**
 * CREATE COMPANY (Super Admin Only)
 */
export async function createCompany(
  data: z.infer<typeof createCompanySchema>
): Promise<CompanyResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate input
    const validation = createCompanySchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    await connectDB();

    // Get plan details
    const Plan = (await import("@/src/models/Plan")).default;
    const plan = await Plan.findById(data.planId);
    if (!plan) {
      return {
        success: false,
        message: "Plan not found",
      };
    }

    // Check if user exists and is not already assigned to a company
    const user = await User.findById(data.adminUserId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Only Admin role users can be assigned as company admin
    if (user.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: "Only users with Admin role can be assigned as company admin. Please select a different user.",
      };
    }

    if (user.companyId) {
      return {
        success: false,
        message: "User is already assigned to a company",
      };
    }

    // Generate slug from company name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existingSlug = await Company.findOne({ slug });
    if (existingSlug) {
      return {
        success: false,
        message: "Company with similar name already exists",
      };
    }

    // Create company
    const company = await Company.create({
      name: data.name,
      slug: slug,
      contactEmail: data.contactEmail,
      branding: {
        primaryColor: "#0F172A",
      },
      subscription: {
        planId: plan._id, // Reference to plan
        planName: plan.name, // Store actual plan name from database
        status: "ACTIVE",
        validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      limits: {
        maxStaff: plan.usersLimit,
        maxStorageMB: 500, // Default storage
      },
      isDeleted: false,
    });

    // Update user to be admin of this company
    await User.findByIdAndUpdate(data.adminUserId, {
      companyId: company._id,
      role: "COMPANY_ADMIN",
    });

    revalidatePath("/dashboard/admin/companies");

    return {
      success: true,
      message: "Company created successfully",
      data: {
        companyId: company._id.toString(),
        slug: company.slug,
      },
    };
  } catch (error: any) {
    console.error("Create company error:", error);
    
    // Better error handling
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0] as any;
      return {
        success: false,
        message: firstError?.message || "Validation error: " + error.message,
      };
    }
    
    if (error.code === 11000) {
      return {
        success: false,
        message: "A company with this name already exists",
      };
    }
    
    return {
      success: false,
      message: error.message || "An error occurred while creating the company",
    };
  }
}

/**
 * UPDATE COMPANY SUBSCRIPTION
 */
export async function updateCompanySubscription(
  companyId: string,
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED"
): Promise<CompanyResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    await connectDB();

    await Company.findByIdAndUpdate(companyId, {
      "subscription.status": status,
    });

    revalidatePath("/dashboard/admin/companies");

    return {
      success: true,
      message: "Subscription status updated",
    };
  } catch (error) {
    console.error("Update subscription error:", error);
    return {
      success: false,
      message: "An error occurred while updating subscription",
    };
  }
}

/**
 * DELETE COMPANY (Soft Delete)
 */
export async function deleteCompany(companyId: string): Promise<CompanyResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    await connectDB();

    // Soft delete company
    await Company.findByIdAndUpdate(companyId, {
      isDeleted: true,
    });

    // Soft delete all users
    await User.updateMany(
      { companyId },
      {
        isDeleted: true,
        isActive: false,
      }
    );

    revalidatePath("/dashboard/admin/companies");

    return {
      success: true,
      message: "Company deleted successfully",
    };
  } catch (error) {
    console.error("Delete company error:", error);
    return {
      success: false,
      message: "An error occurred while deleting company",
    };
  }
}

