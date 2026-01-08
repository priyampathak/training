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
 * GET COMPANY DASHBOARD ANALYTICS
 * Comprehensive real-time analytics for Company Admin
 */
export async function getCompanyDashboardAnalytics(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Company Admin access required.",
      };
    }

    const { User, Company, TrainingModule, ModuleProgress } = await getModels();

    // Get admin's company
    const admin = await User.findById(session.userId).lean();
    if (!admin || !admin.companyId) {
      return {
        success: false,
        message: "Company not found for this admin",
      };
    }

    const companyId = admin.companyId;

    // Get company details
    const company = await Company.findById(companyId)
      .select("name subscription")
      .lean();

    if (!company) {
      return {
        success: false,
        message: "Company not found",
      };
    }

    // Get all team members (staff + admins in this company)
    const allTeamMembers = await User.find({
      companyId: companyId,
      isActive: true,
    })
      .select("name email role lastLoginAt")
      .lean();

    const totalTeamMembers = allTeamMembers.length;
    const adminCount = allTeamMembers.filter((u) => u.role === "COMPANY_ADMIN").length;
    const staffCount = allTeamMembers.filter((u) => u.role === "STAFF").length;

    // Get all available modules (company-specific + global)
    const companyModules = await TrainingModule.find({
      assignedCompanyId: companyId,
      isGlobal: false,
      isActive: true,
    })
      .select("meta assessment settings createdAt")
      .lean();

    const globalModules = await TrainingModule.find({
      isGlobal: true,
      isActive: true,
    })
      .select("meta assessment settings createdAt")
      .lean();

    const totalCompanyModules = companyModules.length;
    const totalGlobalModules = globalModules.length;
    const totalModules = totalCompanyModules + totalGlobalModules;

    // Get all module IDs
    const allModuleIds = [
      ...companyModules.map((m) => m._id),
      ...globalModules.map((m) => m._id),
    ];

    // Get all progress records for this company
    const allProgressRaw = await ModuleProgress.find({
      companyId: companyId,
      moduleId: { $in: allModuleIds },
    })
      .populate("userId", "name email")
      .populate("moduleId", "meta")
      .lean();

    // Filter out records with null userId (deleted users or data inconsistency)
    const allProgress = allProgressRaw.filter((p) => p.userId != null);

    // Calculate overall statistics
    const completedProgress = allProgress.filter((p) => p.status === "COMPLETED");
    const inProgressModules = allProgress.filter((p) => p.status === "IN_PROGRESS");

    const totalAttempts = allProgress.reduce((sum, p) => sum + (p.attemptCount || 0), 0);
    const totalScore = completedProgress.reduce((sum, p) => sum + p.score, 0);
    const totalPossiblePoints = completedProgress.reduce(
      (sum, p) => sum + p.totalPoints,
      0
    );

    const averageScore =
      completedProgress.length > 0
        ? Math.round(
            completedProgress.reduce((sum, p) => sum + p.percentage, 0) /
              completedProgress.length
          )
        : 0;

    const passedCount = completedProgress.filter((p) => p.isPassed).length;
    const failedCount = completedProgress.filter((p) => !p.isPassed).length;
    const passRate =
      completedProgress.length > 0
        ? Math.round((passedCount / completedProgress.length) * 100)
        : 0;

    // Calculate unique user engagement
    const uniqueUsersStarted = new Set(
      allProgress
        .filter((p) => p.userId)
        .map((p) => p.userId._id?.toString() || p.userId.toString())
    ).size;
    const engagementRate =
      staffCount > 0 ? Math.round((uniqueUsersStarted / staffCount) * 100) : 0;

    // Calculate completion rate (completed / total possible completions)
    const totalPossibleCompletions = staffCount * totalModules;
    const completionRate =
      totalPossibleCompletions > 0
        ? Math.round((completedProgress.length / totalPossibleCompletions) * 100)
        : 0;

    // Get recent activity (last 10 completions)
    const recentActivity = allProgress
      .filter((p) => p.status === "COMPLETED" && p.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
      )
      .slice(0, 10)
      .map((p: any) => ({
        userName: p.userId?.name || "Unknown",
        userEmail: p.userId?.email || "",
        moduleName: p.moduleId?.meta?.title || "Unknown Module",
        score: p.score,
        totalPoints: p.totalPoints,
        percentage: p.percentage,
        isPassed: p.isPassed,
        completedAt: p.completedAt,
      }));

    // Top performers (users with highest average scores)
    const userScores = new Map<string, { name: string; scores: number[]; email: string }>();

    completedProgress.forEach((p: any) => {
      const userId = p.userId?._id?.toString() || p.userId?.toString();
      if (!userId) return;

      if (!userScores.has(userId)) {
        userScores.set(userId, {
          name: p.userId?.name || "Unknown",
          email: p.userId?.email || "",
          scores: [],
        });
      }
      userScores.get(userId)!.scores.push(p.percentage);
    });

    const topPerformers = Array.from(userScores.entries())
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        email: data.email,
        averageScore: Math.round(
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        ),
        completedModules: data.scores.length,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    // Module performance (completion rates per module)
    const modulePerformance = new Map<
      string,
      { title: string; completed: number; inProgress: number; total: number }
    >();

    [...companyModules, ...globalModules].forEach((module: any) => {
      const moduleId = module._id.toString();
      const moduleProgress = allProgress.filter(
        (p) => p.moduleId?._id?.toString() === moduleId || p.moduleId?.toString() === moduleId
      );

      const completed = moduleProgress.filter((p) => p.status === "COMPLETED").length;
      const inProgress = moduleProgress.filter((p) => p.status === "IN_PROGRESS").length;

      modulePerformance.set(moduleId, {
        title: module.meta.title,
        completed,
        inProgress,
        total: staffCount,
      });
    });

    const topModules = Array.from(modulePerformance.entries())
      .map(([moduleId, data]) => ({
        moduleId,
        title: data.title,
        completionRate: Math.round((data.completed / data.total) * 100),
        completed: data.completed,
        inProgress: data.inProgress,
        notStarted: data.total - data.completed - data.inProgress,
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 8);

    // Get users who haven't started any training
    const usersWithProgress = new Set(
      allProgress
        .filter((p) => p.userId)
        .map((p) => p.userId._id?.toString() || p.userId.toString())
    );
    const inactiveUsers = allTeamMembers
      .filter(
        (user) =>
          user.role === "STAFF" && !usersWithProgress.has(user._id.toString())
      )
      .slice(0, 5)
      .map((user) => ({
        name: user.name,
        email: user.email,
        lastLogin: user.lastLoginAt,
      }));

    return {
      success: true,
      message: "Dashboard analytics fetched successfully",
      data: {
        company: {
          name: company.name,
          subscription: company.subscription,
          planName: (company as any).subscription?.planName || "Standard Plan",
        },
        overview: {
          totalTeamMembers,
          adminCount,
          staffCount,
          totalModules,
          totalCompanyModules,
          totalGlobalModules,
          completionRate,
          averageScore,
          passRate,
          engagementRate,
        },
        stats: {
          totalAttempts,
          completedModules: completedProgress.length,
          inProgressModules: inProgressModules.length,
          passedCount,
          failedCount,
          totalScore,
          totalPossiblePoints,
          uniqueUsersStarted,
        },
        recentActivity,
        topPerformers,
        topModules,
        inactiveUsers,
      },
    };
  } catch (error: any) {
    console.error("❌ Get company dashboard analytics error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch dashboard analytics",
    };
  }
}

