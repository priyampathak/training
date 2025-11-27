"use server";

import { z } from "zod";
import { getSession } from "./auth";

// Dynamic imports to prevent Mongoose models from being bundled in client
async function getModels() {
  const connectDB = (await import("@/src/lib/db")).default;
  const TrainingModule = (await import("@/src/models/TrainingModule")).default;
  const Company = (await import("@/src/models/Company")).default;
  await connectDB();
  return { TrainingModule, Company };
}

// Zod Schema for creating training modules (company-scoped)
const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  points: z.number().min(1, "Points must be at least 1"),
});

const createModuleSchema = z.object({
  assignedCompanyId: z.string().optional(), // Will be auto-set to current company
  meta: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.enum(["IT & Security", "Communication", "Management", "HR"]),
    tags: z.array(z.string()),
    difficulty: z.enum(["ROOKIE", "PRO", "LEGEND"]),
  }),
  slides: z
    .array(
      z.object({
        heading: z
          .string()
          .min(1, "Heading is required")
          .refine((val) => val.trim().split(/\s+/).length <= 10, {
            message: "Heading must not exceed 10 words",
          }),
        content: z
          .string()
          .min(1, "Content is required")
          .refine((val) => val.trim().split(/\s+/).length <= 100, {
            message: "Content must not exceed 100 words",
          }),
        mediaUrl: z.string().optional(),
        layout: z.enum([
          "SPLIT_IMAGE_RIGHT",
          "SPLIT_IMAGE_LEFT",
          "FULL_WIDTH",
          "IMAGE_TOP",
        ]),
        order: z.number(),
      })
    )
    .min(1, "At least one slide is required"),
  quiz: z.array(quizQuestionSchema).min(1, "At least one question is required"),
  settings: z.object({
    passingPoints: z.number().min(0, "Passing points cannot be negative"),
    isMandatory: z.boolean(),
  }),
  display: z.object({
    headingFontSize: z.number().min(16).max(60).default(32),
    contentFontSize: z.number().min(12).max(32).default(16),
  }),
});

interface ModuleResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET ALL COMPANY TRAINING MODULES (Company Admin Only)
 */
export async function getCompanyTrainingModules(): Promise<ModuleResponse> {
  try {
    console.log("🔍 Getting company training modules...");
    const session = await getSession();
    
    if (!session || session.role !== "COMPANY_ADMIN") {
      console.error("❌ Unauthorized access attempt");
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      console.error("❌ No company assigned to admin");
      return { success: false, message: "No company assigned" };
    }

    console.log("✅ Session valid, company ID:", session.companyId);
    const { TrainingModule, Company } = await getModels();

    // Get company details
    const company = await Company.findById(session.companyId)
      .select("name")
      .lean();

    if (!company) {
      return { success: false, message: "Company not found" };
    }

    // Get only modules assigned to this company (not global)
    const modules = await TrainingModule.find({
      assignedCompanyId: session.companyId,
      isGlobal: false,
      isActive: true,
    })
      .populate("createdBy", "name email")
      .populate("assignedCompanyId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const serializedModules = modules.map((module: any) => {
      try {
        return {
          ...module,
          _id: module._id?.toString() || "",
          assignedCompanyId: module.assignedCompanyId?._id?.toString() || null,
          assignedCompanyName: (module.assignedCompanyId as any)?.name || company.name,
          createdBy: module.createdBy ? {
            _id: (module.createdBy as any)?._id?.toString() || "",
            name: (module.createdBy as any)?.name || "Unknown",
            email: (module.createdBy as any)?.email || "",
          } : {
            _id: "",
            name: "Unknown",
            email: "",
          },
          slides: module.slides?.map((slide: any) => ({
            ...slide,
            _id: slide._id?.toString() || undefined,
          })) || [],
          quiz: module.quiz?.map((question: any) => ({
            ...question,
            _id: question._id?.toString() || undefined,
          })) || [],
          display: {
            headingFontSize: module.display?.headingFontSize || 32,
            contentFontSize: module.display?.contentFontSize || 16,
          },
        };
      } catch (err) {
        console.error("Error serializing module:", err);
        return null;
      }
    }).filter(Boolean); // Remove any null entries

    console.log("✅ Successfully serialized", serializedModules.length, "modules");

    return {
      success: true,
      message: "Modules fetched successfully",
      data: {
        modules: serializedModules,
        companyName: company.name,
        companyId: session.companyId,
      },
    };
  } catch (error: any) {
    console.error("❌ Get company training modules error:", error);
    console.error("Error stack:", error.stack);
    return { 
      success: false, 
      message: error.message || "Failed to fetch modules" 
    };
  }
}

/**
 * CREATE TRAINING MODULE (Company Admin Only)
 */
export async function createCompanyTrainingModule(
  data: z.infer<typeof createModuleSchema>
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Company admin access required.",
      };
    }

    if (!session.companyId) {
      return {
        success: false,
        message: "No company assigned to this admin",
      };
    }

    const { TrainingModule, Company } = await getModels();

    // Validate input
    const validation = createModuleSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      console.error("❌ Validation failed:", errors);
      return {
        success: false,
        message: `Validation failed: ${errors}`,
      };
    }

    // Verify company exists
    const company = await Company.findById(session.companyId);
    if (!company) {
      return {
        success: false,
        message: "Company not found",
      };
    }

    // Calculate total points and passing percentage
    const totalPoints = data.quiz.reduce((sum, q) => sum + (q.points || 0), 0);
    const passingPercentage =
      totalPoints > 0
        ? Math.round((data.settings.passingPoints / totalPoints) * 100)
        : 0;

    if (data.settings.passingPoints > totalPoints) {
      return {
        success: false,
        message: `Passing points (${data.settings.passingPoints}) cannot exceed total points (${totalPoints}).`,
      };
    }

    // Create training module assigned to company
    const newModule = await TrainingModule.create({
      assignedCompanyId: session.companyId, // Always assign to current company
      isGlobal: false, // Company modules are never global
      meta: data.meta,
      slides: data.slides,
      quiz: data.quiz,
      assessment: {
        totalPoints: totalPoints,
        passingPoints: data.settings.passingPoints,
        passingPercentage: passingPercentage,
      },
      settings: {
        isMandatory: data.settings.isMandatory,
      },
      display: {
        headingFontSize: data.display.headingFontSize,
        contentFontSize: data.display.contentFontSize,
      },
      isActive: true,
      createdBy: session.userId,
    });

    return {
      success: true,
      message: "Training module created successfully",
      data: {
        moduleId: newModule._id.toString(),
        title: newModule.meta.title,
      },
    };
  } catch (error: any) {
    console.error("Create company training module error:", error);
    return {
      success: false,
      message:
        error.message || "An error occurred while creating the training module",
    };
  }
}

/**
 * UPDATE MODULE DISPLAY SETTINGS (Company Admin Only)
 */
export async function updateCompanyModuleDisplaySettings(
  moduleId: string,
  headingFontSize: number,
  contentFontSize: number
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Company admin access required.",
      };
    }

    const { TrainingModule } = await getModels();

    const module = await TrainingModule.findById(moduleId);

    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Verify the module belongs to this company
    if (module.assignedCompanyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only edit modules from your company",
      };
    }

    // Ensure the display field exists
    if (!module.display) {
      module.display = { headingFontSize: 32, contentFontSize: 16 };
    }

    module.display.headingFontSize = headingFontSize;
    module.display.contentFontSize = contentFontSize;

    await module.save();

    return { success: true, message: "Font sizes saved successfully!" };
  } catch (error: any) {
    console.error("Update company module display settings error:", error);
    return {
      success: false,
      message:
        error.message || "An error occurred while updating font sizes",
    };
  }
}

/**
 * GET MODULE BY ID (Company Admin Only)
 */
export async function getCompanyModuleById(
  moduleId: string
): Promise<ModuleResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const { TrainingModule } = await getModels();
    const module = await TrainingModule.findById(moduleId)
      .populate("createdBy", "name email")
      .populate("assignedCompanyId", "name")
      .lean();

    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Verify the module belongs to this company
    if (
      module.assignedCompanyId?._id?.toString() !== session.companyId
    ) {
      return {
        success: false,
        message: "You can only view modules from your company",
      };
    }

    // Serialize ObjectIds and ensure default values for display
    const serializedModule: any = {
      ...module,
      _id: module._id.toString(),
      assignedCompanyId: module.assignedCompanyId?._id?.toString() || null,
      assignedCompanyName:
        (module.assignedCompanyId as any)?.name || "Unknown",
      createdBy: {
        _id: (module.createdBy as any)._id.toString(),
        name: (module.createdBy as any).name,
        email: (module.createdBy as any).email,
      },
      slides:
        module.slides?.map((slide: any) => ({
          ...slide,
          _id: slide._id?.toString() || undefined,
        })) || [],
      quiz:
        module.quiz?.map((question: any) => ({
          ...question,
          _id: question._id?.toString() || undefined,
        })) || [],
      display: {
        headingFontSize: module.display?.headingFontSize || 32,
        contentFontSize: module.display?.contentFontSize || 16,
      },
    };

    return {
      success: true,
      message: "Module fetched successfully",
      data: serializedModule,
    };
  } catch (error: any) {
    console.error("Get company module by ID error:", error);
    return { success: false, message: "Failed to fetch module" };
  }
}

/**
 * UPDATE TRAINING MODULE (Company Admin Only)
 */
export async function updateCompanyTrainingModule(
  moduleId: string,
  data: z.infer<typeof createModuleSchema>
): Promise<ModuleResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Company admin access required.",
      };
    }

    const { TrainingModule } = await getModels();

    // Validate input
    const validation = createModuleSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      console.error("❌ Validation failed:", errors);
      return {
        success: false,
        message: `Validation failed: ${errors}`,
      };
    }

    // Find module and verify ownership
    const module = await TrainingModule.findById(moduleId);
    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Verify the module belongs to this company
    if (module.assignedCompanyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only edit modules from your company",
      };
    }

    // Calculate total points and passing percentage
    const totalPoints = data.quiz.reduce((sum, q) => sum + (q.points || 0), 0);
    const passingPercentage =
      totalPoints > 0
        ? Math.round((data.settings.passingPoints / totalPoints) * 100)
        : 0;

    if (data.settings.passingPoints > totalPoints) {
      return {
        success: false,
        message: `Passing points (${data.settings.passingPoints}) cannot exceed total points (${totalPoints}).`,
      };
    }

    const updatedModule = await TrainingModule.findByIdAndUpdate(
      moduleId,
      {
        assignedCompanyId: session.companyId, // Keep assigned to company
        isGlobal: false,
        meta: data.meta,
        slides: data.slides,
        quiz: data.quiz,
        assessment: {
          totalPoints: totalPoints,
          passingPoints: data.settings.passingPoints,
          passingPercentage: passingPercentage,
        },
        settings: {
          isMandatory: data.settings.isMandatory,
        },
        display: {
          headingFontSize: data.display.headingFontSize,
          contentFontSize: data.display.contentFontSize,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedModule) {
      return { success: false, message: "Module not found" };
    }

    return {
      success: true,
      message: "Training module updated successfully",
      data: {
        moduleId: updatedModule._id.toString(),
        title: updatedModule.meta.title,
      },
    };
  } catch (error: any) {
    console.error("Update company module error:", error);
    return {
      success: false,
      message:
        error.message ||
        "An error occurred while updating the training module",
    };
  }
}

/**
 * DELETE MODULE (Company Admin Only)
 */
export async function deleteCompanyModule(
  moduleId: string
): Promise<ModuleResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const { TrainingModule } = await getModels();

    const module = await TrainingModule.findById(moduleId);
    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Verify the module belongs to this company
    if (module.assignedCompanyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only delete modules from your company",
      };
    }

    // Soft delete
    module.isActive = false;
    await module.save();

    return { success: true, message: "Module deleted successfully" };
  } catch (error: any) {
    console.error("Delete company module error:", error);
    return { success: false, message: "Failed to delete module" };
  }
}

/**
 * TOGGLE MODULE STATUS (Company Admin Only)
 */
export async function toggleCompanyModuleStatus(
  moduleId: string
): Promise<ModuleResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const { TrainingModule } = await getModels();

    const module = await TrainingModule.findById(moduleId);
    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Verify the module belongs to this company
    if (module.assignedCompanyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only modify modules from your company",
      };
    }

    module.isActive = !module.isActive;
    await module.save();

    return {
      success: true,
      message: `Module ${module.isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error: any) {
    console.error("Toggle company module status error:", error);
    return { success: false, message: "Failed to toggle module status" };
  }
}

