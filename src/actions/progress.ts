"use server";

import { getSession } from "./auth";

// Dynamic imports to prevent Mongoose models from being bundled in client
async function getModels() {
  const connectDB = (await import("@/src/lib/db")).default;
  const User = (await import("@/src/models/User")).default;
  const Company = (await import("@/src/models/Company")).default;
  const TrainingModule = (await import("@/src/models/TrainingModule")).default;
  const ModuleProgress = (await import("@/src/models/ModuleProgress")).default;
  await connectDB();
  return { User, Company, TrainingModule, ModuleProgress };
}

/**
 * GET STAFF PROGRESS - Detailed progress for all modules
 */
export async function getStaffProgress(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const session = await getSession();

    if (!session || session.role !== "STAFF") {
      return {
        success: false,
        message: "Unauthorized. Staff access required.",
      };
    }

    const { User, Company, TrainingModule, ModuleProgress } = await getModels();

    // Get user details
    const user = await User.findById(session.userId)
      .populate("companyId", "name")
      .lean();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const companyId = user.companyId;
    const companyName = (user.companyId as any)?.name || "No Company";

    // Get all available modules (company + global)
    const availableModules = await TrainingModule.find({
      $or: [
        { assignedCompanyId: companyId, isGlobal: false },
        { isGlobal: true },
      ],
      isActive: true,
    })
      .populate("createdBy", "name")
      .populate("assignedCompanyId", "name")
      .lean();

    // Get all progress records for this user
    const allProgress = await ModuleProgress.find({
      userId: session.userId,
    }).lean();

    // Create a map of moduleId to progress
    const progressMap = new Map();
    allProgress.forEach((progress: any) => {
      progressMap.set(progress.moduleId.toString(), progress);
    });

    // Build detailed progress array
    const detailedProgress = availableModules.map((module: any) => {
      const moduleId = module._id.toString();
      const progress = progressMap.get(moduleId);

      return {
        moduleId,
        moduleTitle: module.meta.title,
        moduleDescription: module.meta.description,
        category: module.meta.category,
        difficulty: module.meta.difficulty,
        isGlobal: module.isGlobal,
        isMandatory: module.settings?.isMandatory || false,
        totalSlides: module.slides?.length || 0,
        totalQuestions: module.quiz?.length || 0,
        totalPoints: module.assessment?.totalPoints || 0,
        passingPoints: module.assessment?.passingPoints || 0,
        passingPercentage: module.assessment?.passingPercentage || 0,
        status: progress?.status || "NOT_STARTED",
        score: progress?.score || 0,
        percentage: progress?.percentage || 0,
        isPassed: progress?.isPassed || false,
        attemptCount: progress?.attemptCount || 0,
        startedAt: progress?.startedAt || null,
        completedAt: progress?.completedAt || null,
        lastAttemptAt: progress?.lastAttemptAt || null,
        createdBy: (module.createdBy as any)?.name || "Unknown",
      };
    });

    // Calculate summary statistics
    const totalModules = detailedProgress.length;
    const completedModules = detailedProgress.filter(
      (m) => m.status === "COMPLETED"
    ).length;
    const inProgressModules = detailedProgress.filter(
      (m) => m.status === "IN_PROGRESS"
    ).length;
    const notStartedModules = detailedProgress.filter(
      (m) => m.status === "NOT_STARTED"
    ).length;
    const passedModules = detailedProgress.filter((m) => m.isPassed).length;
    const failedModules = detailedProgress.filter(
      (m) => m.status === "COMPLETED" && !m.isPassed
    ).length;

    const totalScore = detailedProgress
      .filter((m) => m.status === "COMPLETED")
      .reduce((sum, m) => sum + m.score, 0);
    const totalPossiblePoints = detailedProgress
      .filter((m) => m.status === "COMPLETED")
      .reduce((sum, m) => sum + m.totalPoints, 0);
    const averageScore =
      completedModules > 0
        ? Math.round(
            detailedProgress
              .filter((m) => m.status === "COMPLETED")
              .reduce((sum, m) => sum + m.percentage, 0) / completedModules
          )
        : 0;

    const totalAttempts = detailedProgress.reduce(
      (sum, m) => sum + m.attemptCount,
      0
    );

    // Mandatory vs optional stats
    const mandatoryModules = detailedProgress.filter((m) => m.isMandatory);
    const completedMandatory = mandatoryModules.filter(
      (m) => m.status === "COMPLETED"
    ).length;
    const mandatoryCompletionRate =
      mandatoryModules.length > 0
        ? Math.round((completedMandatory / mandatoryModules.length) * 100)
        : 0;

    return {
      success: true,
      message: "Progress fetched successfully",
      data: {
        user: {
          name: user.name,
          email: user.email,
          company: companyName,
        },
        summary: {
          totalModules,
          completedModules,
          inProgressModules,
          notStartedModules,
          passedModules,
          failedModules,
          completionRate: Math.round((completedModules / totalModules) * 100),
          passRate:
            completedModules > 0
              ? Math.round((passedModules / completedModules) * 100)
              : 0,
          averageScore,
          totalScore,
          totalPossiblePoints,
          totalAttempts,
          mandatoryModules: mandatoryModules.length,
          completedMandatory,
          mandatoryCompletionRate,
        },
        progress: detailedProgress,
      },
    };
  } catch (error: any) {
    console.error("❌ Get staff progress error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch progress",
    };
  }
}

