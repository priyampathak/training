"use server";

import { getSession } from "./auth";

// Dynamic imports to prevent Mongoose models from being bundled in client
async function getModels() {
  const connectDB = (await import("@/src/lib/db")).default;
  const User = (await import("@/src/models/User")).default;
  const TrainingModule = (await import("@/src/models/TrainingModule")).default;
  const ModuleProgress = (await import("@/src/models/ModuleProgress")).default;
  const Company = (await import("@/src/models/Company")).default;
  await connectDB();
  return { User, TrainingModule, ModuleProgress, Company };
}

interface AnalyticsResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET COMPANY ANALYTICS OVERVIEW
 */
export async function getCompanyAnalytics(): Promise<AnalyticsResponse> {
  try {
    console.log("🔍 Getting company analytics...");
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      return { success: false, message: "No company assigned" };
    }

    const { User, TrainingModule, ModuleProgress, Company } = await getModels();

    // Get company details
    const company = await Company.findById(session.companyId).lean();
    if (!company) {
      return { success: false, message: "Company not found" };
    }

    // Get all staff in company
    const allStaff = await User.find({
      companyId: session.companyId,
      isActive: true,
      isDeleted: false,
    }).lean();

    const totalStaff = allStaff.length;

    // Get all modules (company + global)
    const companyModules = await TrainingModule.find({
      assignedCompanyId: session.companyId,
      isGlobal: false,
      isActive: true,
    }).lean();

    const globalModules = await TrainingModule.find({
      isGlobal: true,
      isActive: true,
    }).lean();

    const allModules = [...companyModules, ...globalModules];
    const totalModules = allModules.length;

    // Get all progress records for this company
    const allProgress = await ModuleProgress.find({
      companyId: session.companyId,
    }).lean();

    // Calculate overall statistics
    const completedModules = allProgress.filter((p) => p.status === "COMPLETED");
    const totalAttempts = allProgress.reduce((sum, p) => sum + (p.attemptCount || 0), 0);
    const totalScore = completedModules.reduce((sum, p) => sum + (p.percentage || 0), 0);
    const passedModules = completedModules.filter((p) => p.isPassed);

    const overallCompletionRate =
      totalStaff > 0 && totalModules > 0
        ? ((completedModules.length / (totalStaff * totalModules)) * 100).toFixed(1)
        : "0.0";

    const averageScore =
      completedModules.length > 0
        ? (totalScore / completedModules.length).toFixed(1)
        : "0.0";

    const passRate =
      completedModules.length > 0
        ? ((passedModules.length / completedModules.length) * 100).toFixed(1)
        : "0.0";

    // Active users (users who have started at least one module)
    const activeUserIds = new Set(allProgress.map((p) => p.userId.toString()));
    const activeUsers = activeUserIds.size;

    // Module performance breakdown
    const modulePerformance = await Promise.all(
      allModules.map(async (module: any) => {
        const moduleProgress = allProgress.filter(
          (p) => p.moduleId.toString() === module._id.toString()
        );

        const completed = moduleProgress.filter((p) => p.status === "COMPLETED");
        const passed = completed.filter((p) => p.isPassed);
        const inProgress = moduleProgress.filter((p) => p.status === "IN_PROGRESS");
        const failed = moduleProgress.filter((p) => p.status === "FAILED");

        const completionRate =
          totalStaff > 0 ? ((completed.length / totalStaff) * 100).toFixed(1) : "0.0";

        const avgScore =
          completed.length > 0
            ? (
                completed.reduce((sum, p) => sum + (p.percentage || 0), 0) /
                completed.length
              ).toFixed(1)
            : "0.0";

        const passRateModule =
          completed.length > 0
            ? ((passed.length / completed.length) * 100).toFixed(1)
            : "0.0";

        const totalAttemptsModule = moduleProgress.reduce(
          (sum, p) => sum + (p.attemptCount || 0),
          0
        );

        return {
          moduleId: module._id.toString(),
          title: module.meta?.title || "Untitled",
          category: module.meta?.category || "General",
          isGlobal: module.isGlobal || false,
          totalAssigned: totalStaff,
          completed: completed.length,
          inProgress: inProgress.length,
          failed: failed.length,
          notStarted: totalStaff - moduleProgress.length,
          completionRate: parseFloat(completionRate),
          averageScore: parseFloat(avgScore),
          passRate: parseFloat(passRateModule),
          totalAttempts: totalAttemptsModule,
          passed: passed.length,
        };
      })
    );

    // User performance breakdown
    const userPerformance = allStaff.map((user: any) => {
      const userProgress = allProgress.filter(
        (p) => p.userId.toString() === user._id.toString()
      );

      const completed = userProgress.filter((p) => p.status === "COMPLETED");
      const passed = completed.filter((p) => p.isPassed);
      const inProgress = userProgress.filter((p) => p.status === "IN_PROGRESS");

      const completionRate =
        totalModules > 0
          ? ((completed.length / totalModules) * 100).toFixed(1)
          : "0.0";

      const avgScore =
        completed.length > 0
          ? (
              completed.reduce((sum, p) => sum + (p.percentage || 0), 0) /
              completed.length
            ).toFixed(1)
          : "0.0";

      return {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        totalModules: totalModules,
        completed: completed.length,
        inProgress: inProgress.length,
        notStarted: totalModules - userProgress.length,
        completionRate: parseFloat(completionRate),
        averageScore: parseFloat(avgScore),
        passed: passed.length,
        failed: completed.length - passed.length,
      };
    });

    // Sort users by completion rate (top performers)
    const topPerformers = [...userPerformance]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    // Recent activity (last 10 completions)
    const recentActivity = await ModuleProgress.find({
      companyId: session.companyId,
      status: "COMPLETED",
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("moduleId", "meta.title")
      .lean();

    const serializedActivity = recentActivity.map((activity: any) => ({
      userName: activity.userId?.name || "Unknown",
      userEmail: activity.userId?.email || "Unknown",
      moduleTitle: activity.moduleId?.meta?.title || "Untitled",
      score: activity.percentage || 0,
      isPassed: activity.isPassed,
      completedAt: activity.completedAt?.toISOString() || null,
    }));

    console.log("✅ Analytics calculated successfully");

    return {
      success: true,
      message: "Analytics fetched successfully",
      data: {
        companyName: (company as any).name,
        overview: {
          totalStaff,
          totalModules,
          activeUsers,
          totalAttempts,
          completionRate: parseFloat(overallCompletionRate),
          averageScore: parseFloat(averageScore),
          passRate: parseFloat(passRate),
          completedModules: completedModules.length,
          passedModules: passedModules.length,
        },
        modulePerformance,
        userPerformance,
        topPerformers,
        recentActivity: serializedActivity,
      },
    };
  } catch (error: any) {
    console.error("❌ Get analytics error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch analytics",
    };
  }
}

/**
 * GET DETAILED MODULE ANALYTICS (Per User)
 */
export async function getModuleDetailedAnalytics(
  moduleId: string
): Promise<AnalyticsResponse> {
  try {
    console.log("🔍 Getting detailed analytics for module:", moduleId);
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      console.error("❌ Unauthorized access");
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      console.error("❌ No company assigned");
      return { success: false, message: "No company assigned" };
    }

    console.log("✅ Session valid, company ID:", session.companyId);
    const { User, TrainingModule, ModuleProgress } = await getModels();

    // Get module details
    const module = await TrainingModule.findById(moduleId).lean();
    if (!module) {
      console.error("❌ Module not found:", moduleId);
      return { success: false, message: "Module not found" };
    }

    console.log("✅ Module found:", (module as any).meta?.title);

    // Get all progress for this module - check with and without companyId
    const moduleProgressQuery: any = {
      moduleId: moduleId,
    };

    // Only filter by companyId if the module is not global
    if (!(module as any).isGlobal) {
      moduleProgressQuery.companyId = session.companyId;
    }

    console.log("📊 Querying progress with:", moduleProgressQuery);

    const moduleProgress = await ModuleProgress.find(moduleProgressQuery)
      .populate("userId", "name email role")
      .sort({ updatedAt: -1 })
      .lean();

    console.log("📥 Found progress records:", moduleProgress.length);

    // Get all staff to find users who haven't started
    const allStaff = await User.find({
      companyId: session.companyId,
      isActive: true,
      isDeleted: false,
    }).lean();

    console.log("👥 Total staff in company:", allStaff.length);

    const usersWithProgress = moduleProgress.map((p) => p.userId._id.toString());
    const usersNotStarted = allStaff.filter(
      (user: any) => !usersWithProgress.includes(user._id.toString())
    );

    console.log("✅ Users with progress:", usersWithProgress.length);
    console.log("⏸️  Users not started:", usersNotStarted.length);

    // Serialize progress data
    const userResponses = moduleProgress.map((progress: any) => ({
      userId: progress.userId._id.toString(),
      userName: progress.userId.name,
      userEmail: progress.userId.email,
      userRole: progress.userId.role,
      status: progress.status,
      score: progress.score || 0,
      percentage: progress.percentage || 0,
      isPassed: progress.isPassed,
      attempts: progress.attemptCount || 0,
      lastAttemptAt: progress.lastAttemptAt?.toISOString() || null,
      completedAt: progress.completedAt?.toISOString() || null,
      timeTaken: progress.completedAt && progress.lastAttemptAt
        ? Math.round(
            (new Date(progress.completedAt).getTime() -
              new Date(progress.lastAttemptAt).getTime()) /
              1000 / 60
          ) // minutes
        : null,
    }));

    const notStartedUsers = usersNotStarted.map((user: any) => ({
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      status: "NOT_STARTED",
      score: 0,
      percentage: 0,
      isPassed: false,
      attempts: 0,
      lastAttemptAt: null,
      completedAt: null,
      timeTaken: null,
    }));

    const allUserData = [...userResponses, ...notStartedUsers];

    // Calculate statistics
    const completed = userResponses.filter((u) => u.status === "COMPLETED");
    const passed = completed.filter((u) => u.isPassed);
    const inProgress = userResponses.filter((u) => u.status === "IN_PROGRESS");
    const failed = userResponses.filter((u) => u.status === "FAILED");

    const avgScore =
      completed.length > 0
        ? (
            completed.reduce((sum, u) => sum + u.percentage, 0) / completed.length
          ).toFixed(1)
        : "0.0";

    const avgAttempts =
      userResponses.length > 0
        ? (
            userResponses.reduce((sum, u) => sum + (u.attempts || 0), 0) /
            userResponses.length
          ).toFixed(1)
        : "0.0";

    const completionRate =
      allStaff.length > 0
        ? ((completed.length / allStaff.length) * 100).toFixed(1)
        : "0.0";

    const analyticsData = {
      moduleTitle: (module as any).meta?.title || "Untitled",
      moduleCategory: (module as any).meta?.category || "General",
      isGlobal: (module as any).isGlobal || false,
      totalQuestions: (module as any).quiz?.length || 0,
      passingPoints: (module as any).assessment?.passingPoints || 0,
      totalPoints: (module as any).assessment?.totalPoints || 0,
      statistics: {
        totalUsers: allStaff.length,
        completed: completed.length,
        inProgress: inProgress.length,
        failed: failed.length,
        notStarted: notStartedUsers.length,
        passed: passed.length,
        averageScore: parseFloat(avgScore),
        averageAttempts: parseFloat(avgAttempts),
        completionRate: parseFloat(completionRate),
        passRate:
          completed.length > 0
            ? parseFloat(((passed.length / completed.length) * 100).toFixed(1))
            : 0,
      },
      userResponses: allUserData,
    };

    console.log("✅ Analytics calculated successfully");
    console.log("📊 Statistics:", analyticsData.statistics);

    return {
      success: true,
      message: "Module analytics fetched successfully",
      data: analyticsData,
    };
  } catch (error: any) {
    console.error("❌ Get module analytics error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch module analytics",
    };
  }
}

