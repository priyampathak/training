"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import connectDB from "@/src/lib/db";
import TrainingModule from "@/src/models/TrainingModule";
import Company from "@/src/models/Company";
import { getSession } from "./auth";

// Validation Schema for Module Creation
const slideSchema = z.object({
  heading: z.string().min(1, "Slide heading is required"),
  content: z.string().min(1, "Slide content is required"),
  mediaUrl: z.string().optional(),
  layout: z.enum(["SPLIT_IMAGE_RIGHT", "SPLIT_IMAGE_LEFT", "FULL_WIDTH", "IMAGE_TOP"]).default("SPLIT_IMAGE_RIGHT"),
  order: z.number(),
});

const quizSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).length(4, "Must have exactly 4 options"),
  correctIndex: z.number().min(0).max(3),
  points: z.number().min(1, "Points must be at least 1"),
});

const createModuleSchema = z.object({
  assignedCompanyId: z.string().optional(),
  meta: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.enum(["IT & Security", "Communication", "Management", "HR"]),
    tags: z.array(z.string()),
    difficulty: z.enum(["ROOKIE", "PRO", "LEGEND"]),
  }),
  slides: z.array(slideSchema).min(1, "At least one slide is required"),
  quiz: z.array(quizSchema).min(1, "At least one quiz question is required"),
  settings: z.object({
    passingPoints: z.number().min(0, "Passing points cannot be negative"),
    isMandatory: z.boolean(),
  }),
  display: z.object({
    headingFontSize: z.number().min(16).max(60),
    contentFontSize: z.number().min(12).max(32),
  }),
});

interface ModuleResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET ALL COMPANIES FOR DROPDOWN (Super Admin Only)
 */
export async function getCompaniesForModule(): Promise<ModuleResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    await connectDB();

    const companies = await Company.find({ isDeleted: false })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    return {
      success: true,
      message: "Companies fetched successfully",
      data: companies.map((company) => ({
        _id: company._id.toString(),
        name: company.name,
      })),
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
 * GET ALL MODULES (Super Admin Only)
 */
export async function getAllModules(): Promise<ModuleResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    const modules = await TrainingModule.find({})
      .populate("createdBy", "name email")
      .populate("assignedCompanyId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Modules fetched successfully",
      data: modules.map((module: any) => ({
        ...module,
        _id: module._id.toString(),
        assignedCompanyId: module.assignedCompanyId?._id?.toString() || null,
        assignedCompanyName: module.assignedCompanyId?.name || "Global",
        createdBy: module.createdBy ? {
          _id: module.createdBy._id.toString(),
          name: module.createdBy.name,
          email: module.createdBy.email,
        } : {
          _id: "unknown",
          name: "Unknown User",
          email: "N/A",
        },
        slides: module.slides?.map((slide: any) => ({
          ...slide,
          _id: slide._id?.toString() || undefined,
        })) || [],
        quiz: module.quiz?.map((question: any) => ({
          ...question,
          _id: question._id?.toString() || undefined,
        })) || [],
        // Ensure display settings are included
        display: module.display || {
          headingFontSize: 32,
          contentFontSize: 16,
        },
      })),
    };
  } catch (error) {
    console.error("Get modules error:", error);
    return {
      success: false,
      message: "An error occurred while fetching modules",
    };
  }
}

/**
 * CREATE MODULE (Super Admin Only)
 */
export async function createTrainingModule(
  data: z.infer<typeof createModuleSchema>
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate input
    const validation = createModuleSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    await connectDB();

    // Check if company exists (if provided)
    if (data.assignedCompanyId) {
      const company = await Company.findById(data.assignedCompanyId);
      if (!company) {
        return {
          success: false,
          message: "Company not found",
        };
      }
    }

    // Calculate total points from quiz
    const totalPoints = data.quiz.reduce((sum, q) => sum + q.points, 0);
    
    // Calculate passing percentage for display
    const passingPercentage = totalPoints > 0 
      ? Math.round((data.settings.passingPoints / totalPoints) * 100) 
      : 0;

    // Validate passing points
    if (data.settings.passingPoints > totalPoints) {
      return {
        success: false,
        message: `Passing points (${data.settings.passingPoints}) cannot exceed total points (${totalPoints})`,
      };
    }

    // Create module
    const module = await TrainingModule.create({
      assignedCompanyId: data.assignedCompanyId || null,
      isGlobal: !data.assignedCompanyId,
      meta: data.meta,
      slides: data.slides,
      quiz: data.quiz,
      assessment: {
        totalPoints,
        passingPoints: data.settings.passingPoints,
        passingPercentage,
      },
      settings: {
        isMandatory: data.settings.isMandatory,
        attemptsAllowed: -1, // Default unlimited
        certificateEnabled: false, // Default disabled
      },
      display: {
        headingFontSize: data.display.headingFontSize,
        contentFontSize: data.display.contentFontSize,
      },
      createdBy: session.userId,
      isActive: true,
    });

    revalidatePath("/dashboard/admin/modules");

    return {
      success: true,
      message: "Module created successfully",
      data: {
        moduleId: module._id.toString(),
        title: module.meta.title,
      },
    };
  } catch (error: any) {
    console.error("Create module error:", error);
    return {
      success: false,
      message: error.message || "An error occurred while creating the module",
    };
  }
}

/**
 * DELETE MODULE (Super Admin Only)
 */
export async function deleteModule(moduleId: string): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    const module = await TrainingModule.findByIdAndDelete(moduleId);

    if (!module) {
      return {
        success: false,
        message: "Module not found",
      };
    }

    revalidatePath("/dashboard/admin/modules");

    return {
      success: true,
      message: "Module deleted successfully",
    };
  } catch (error) {
    console.error("Delete module error:", error);
    return {
      success: false,
      message: "An error occurred while deleting the module",
    };
  }
}

/**
 * TOGGLE MODULE STATUS (Super Admin Only)
 */
export async function toggleModuleStatus(
  moduleId: string,
  isActive: boolean
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    const module = await TrainingModule.findByIdAndUpdate(
      moduleId,
      { isActive },
      { new: true }
    );

    if (!module) {
      return {
        success: false,
        message: "Module not found",
      };
    }

    revalidatePath("/dashboard/admin/modules");

    return {
      success: true,
      message: `Module ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Toggle module status error:", error);
    return {
      success: false,
      message: "An error occurred while updating module status",
    };
  }
}

/**
 * UPDATE MODULE DISPLAY SETTINGS (Super Admin & Company Admin)
 * Updates the font sizes for heading and content
 */
export async function updateModuleDisplaySettings(
  moduleId: string,
  headingFontSize: number,
  contentFontSize: number
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "COMPANY_ADMIN")) {
      return {
        success: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    // Validate font sizes
    if (headingFontSize < 16 || headingFontSize > 60) {
      return {
        success: false,
        message: "Heading font size must be between 16 and 60 pixels",
      };
    }

    if (contentFontSize < 12 || contentFontSize > 32) {
      return {
        success: false,
        message: "Content font size must be between 12 and 32 pixels",
      };
    }

    await connectDB();

    const module = await TrainingModule.findById(moduleId);
    
    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // For Company Admins, verify they own this module
    if (session.role === "COMPANY_ADMIN") {
      const User = (await import("@/src/models/User")).default;
      const user = await User.findById(session.userId);
      
      if (!user || !user.companyId) {
        return {
          success: false,
          message: "Company not found",
        };
      }

      // Check if module belongs to this company
      if (module.assignedCompanyId?.toString() !== user.companyId.toString()) {
        return {
          success: false,
          message: "Unauthorized. You can only update your company's modules.",
        };
      }
    }

    // Update display settings
    if (!module.display) {
      module.display = {
        headingFontSize: 32,
        contentFontSize: 18,
      };
    }
    
    module.display.headingFontSize = headingFontSize;
    module.display.contentFontSize = contentFontSize;
    
    await module.save();

    revalidatePath("/dashboard/admin/modules");

    console.log(`✅ Updated display settings for module ${moduleId}:`, {
      headingFontSize,
      contentFontSize,
    });

    return {
      success: true,
      message: "Font sizes updated successfully",
      data: {
        display: {
          headingFontSize: module.display.headingFontSize,
          contentFontSize: module.display.contentFontSize,
        },
      },
    };
  } catch (error) {
    console.error("Update display settings error:", error);
    return {
      success: false,
      message: "An error occurred while updating font sizes",
    };
  }
}

/**
 * UPDATE TRAINING MODULE (Super Admin Only)
 */
export async function updateTrainingModule(
  moduleId: string,
  data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    difficulty: string;
    slides: any[];
    quiz: any[];
    passingPoints: number;
    isMandatory: boolean;
    headingFontSize: number;
    contentFontSize: number;
  }
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    const module = await TrainingModule.findById(moduleId);

    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Calculate total points
    const totalPoints = data.quiz.reduce((sum: number, q: any) => sum + (q.points || 0), 0);
    const passingPercentage = totalPoints > 0 ? Math.round((data.passingPoints / totalPoints) * 100) : 0;

    // Update module fields
    module.meta = {
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags,
      difficulty: data.difficulty as "ROOKIE" | "PRO" | "LEGEND",
    };

    module.slides = data.slides;
    module.quiz = data.quiz;

    module.assessment = {
      totalPoints,
      passingPoints: data.passingPoints,
      passingPercentage,
    };

    module.settings = {
      isMandatory: data.isMandatory,
      attemptsAllowed: module.settings.attemptsAllowed || -1,
      certificateEnabled: module.settings.certificateEnabled || false,
    };

    module.display = {
      headingFontSize: data.headingFontSize,
      contentFontSize: data.contentFontSize,
    };

    await module.save();

    revalidatePath("/dashboard/admin/modules");

    console.log(`✅ Updated module ${moduleId}:`, {
      title: data.title,
      slidesCount: data.slides.length,
      quizCount: data.quiz.length,
    });

    return {
      success: true,
      message: "Module updated successfully",
      data: {
        moduleId: module._id.toString(),
        title: module.meta.title,
      },
    };
  } catch (error: any) {
    console.error("Update module error:", error);
    return {
      success: false,
      message: error.message || "An error occurred while updating the module",
    };
  }
}
