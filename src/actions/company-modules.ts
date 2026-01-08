import { z } from "zod";
import connectDB from "@/src/lib/db";
import TrainingModule from "@/src/models/TrainingModule";
import ModuleProgress from "@/src/models/ModuleProgress";
import User from "@/src/models/User";
import Company from "@/src/models/Company";
import { getSession } from "./auth";

interface CompanyModulesResponse {
  success: boolean;
  message: string;
  data?: {
    companyModules: any[];
    globalModules: any[];
    companyName: string;
    companyId: string;
    stats: {
      totalStaff: number;
      totalModules: number;
      companyModulesCount: number;
      globalModulesCount: number;
    };
  };
}

/**
 * GET ALL MODULES FOR COMPANY ADMIN
 * Returns company-specific and global training modules with real-time analytics
 */
export async function getCompanyModules(): Promise<CompanyModulesResponse> {
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

    await connectDB();

    // Get company details
    const company = await Company.findById(session.companyId).select("name").lean();

    if (!company) {
      return {
        success: false,
        message: "Company not found",
      };
    }

    // Get total ACTIVE staff count in the company (real-time)
    const totalStaff = await User.countDocuments({
      companyId: session.companyId,
      role: "STAFF",
      isActive: true,
      isDeleted: false,
    });

    console.log(`📊 Company: ${company.name}, Total Active Staff: ${totalStaff}`);

    // Get company-specific modules
    const companyModules = await TrainingModule.find({
      assignedCompanyId: session.companyId,
      isGlobal: false,
      isActive: true,
    })
      .select("meta assignedCompanyId assessment settings createdAt slides quiz display")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Get global modules
    const globalModules = await TrainingModule.find({
      isGlobal: true,
      isActive: true,
    })
      .select("meta assignedCompanyId assessment settings createdAt slides quiz display")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Get all staff member IDs in the company
    const companyStaff = await User.find({
      companyId: session.companyId,
      role: "STAFF",
      isActive: true,
      isDeleted: false,
    })
      .select("_id")
      .lean();

    const staffIds = companyStaff.map((staff) => staff._id);

    console.log(`👥 Staff IDs for analytics: ${staffIds.length} users`);

    // Get ALL progress records for company staff (real-time data)
    const allProgress = await ModuleProgress.find({
      userId: { $in: staffIds },
    }).lean();

    console.log(`📈 Total Progress Records: ${allProgress.length}`);

    // Create a map of moduleId -> analytics data
    // Key insight: Each user can have only ONE progress record per module (enforced by unique index)
    const progressStatsMap = new Map();

    allProgress.forEach((progress) => {
      const moduleId = progress.moduleId.toString();
      
      if (!progressStatsMap.has(moduleId)) {
        progressStatsMap.set(moduleId, {
          uniqueUsers: new Set(), // Track unique users who interacted with this module
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          passed: 0,
          failed: 0,
          totalScore: 0, // Sum of percentage scores for completed modules
          totalPoints: 0, // Sum of actual points scored
          completedCount: 0, // Count of completed attempts
        });
      }

      const stats = progressStatsMap.get(moduleId);
      
      // Add user to unique set (each user counted once per module)
      stats.uniqueUsers.add(progress.userId.toString());

      // Categorize by status
      if (progress.status === "COMPLETED") {
        stats.completed++;
        stats.totalScore += progress.percentage;
        stats.totalPoints += progress.score;
        stats.completedCount++;
        
        if (progress.isPassed) {
          stats.passed++;
        } else {
          stats.failed++;
        }
      } else if (progress.status === "IN_PROGRESS") {
        stats.inProgress++;
      }
      // NOT_STARTED and FAILED are not stored in DB, they're calculated
    });

    // Helper function to calculate analytics for a module
    const calculateModuleAnalytics = (moduleId: string) => {
      const progressStats = progressStatsMap.get(moduleId);

      if (!progressStats) {
        // No one has started this module
        return {
          totalStaff,
          uniqueUsersStarted: 0,
          completed: 0,
          inProgress: 0,
          notStarted: totalStaff,
          passed: 0,
          failed: 0,
          averageScore: 0,
          averagePoints: 0,
          completionRate: 0,
          passRate: 0,
          engagementRate: 0,
        };
      }

      const uniqueUsersStarted = progressStats.uniqueUsers.size;
      const notStarted = Math.max(0, totalStaff - uniqueUsersStarted);
      
      // Average Score = (Sum of all percentage scores) / (Number of completed attempts)
      const averageScore = 
        progressStats.completedCount > 0
          ? Math.round(progressStats.totalScore / progressStats.completedCount)
          : 0;

      // Average Points = (Sum of all points scored) / (Number of completed attempts)
      const averagePoints =
        progressStats.completedCount > 0
          ? Math.round(progressStats.totalPoints / progressStats.completedCount)
          : 0;

      // Completion Rate = (Completed users / Total staff) * 100
      const completionRate = 
        totalStaff > 0
          ? Math.round((progressStats.completed / totalStaff) * 100)
          : 0;

      // Pass Rate = (Passed / Completed) * 100
      const passRate = 
        progressStats.completed > 0
          ? Math.round((progressStats.passed / progressStats.completed) * 100)
          : 0;

      // Engagement Rate = (Users who started / Total staff) * 100
      const engagementRate =
        totalStaff > 0
          ? Math.round((uniqueUsersStarted / totalStaff) * 100)
          : 0;

      return {
        totalStaff,
        uniqueUsersStarted,
        completed: progressStats.completed,
        inProgress: progressStats.inProgress,
        notStarted,
        passed: progressStats.passed,
        failed: progressStats.failed,
        averageScore,
        averagePoints,
        completionRate,
        passRate,
        engagementRate,
      };
    };

    // Add real-time analytics to company modules
    const companyModulesWithAnalytics = companyModules.map((module: any) => {
      const moduleId = module._id.toString();
      const analytics = calculateModuleAnalytics(moduleId);

      console.log(`📊 Module: ${module.meta.title}`);
      console.log(`   - Completion Rate: ${analytics.completionRate}%`);
      console.log(`   - Completed: ${analytics.completed}/${analytics.totalStaff}`);
      console.log(`   - In Progress: ${analytics.inProgress}`);
      console.log(`   - Not Started: ${analytics.notStarted}`);
      console.log(`   - Pass Rate: ${analytics.passRate}%`);
      console.log(`   - Average Score: ${analytics.averageScore}%`);

      return {
        _id: moduleId,
        title: module.meta.title,
        description: module.meta.description,
        category: module.meta.category,
        difficulty: module.meta.difficulty,
        tags: module.meta.tags,
        totalPoints: module.assessment.totalPoints,
        passingPoints: module.assessment.passingPoints,
        passingPercentage: module.assessment.passingPercentage,
        isMandatory: module.settings.isMandatory,
        slidesCount: module.slides?.length || 0,
        questionsCount: module.quiz?.length || 0,
        createdBy: {
          name: module.createdBy?.name || "Unknown",
          email: module.createdBy?.email || "",
        },
        createdAt: module.createdAt,
        analytics,
      };
    });

    // Add real-time analytics to global modules
    const globalModulesWithAnalytics = globalModules.map((module: any) => {
      const moduleId = module._id.toString();
      const analytics = calculateModuleAnalytics(moduleId);

      return {
        _id: moduleId,
        title: module.meta.title,
        description: module.meta.description,
        category: module.meta.category,
        difficulty: module.meta.difficulty,
        tags: module.meta.tags,
        totalPoints: module.assessment.totalPoints,
        passingPoints: module.assessment.passingPoints,
        passingPercentage: module.assessment.passingPercentage,
        isMandatory: module.settings.isMandatory,
        slidesCount: module.slides?.length || 0,
        questionsCount: module.quiz?.length || 0,
        createdBy: {
          name: module.createdBy?.name || "Unknown",
          email: module.createdBy?.email || "",
        },
        createdAt: module.createdAt,
        analytics,
      };
    });

    return {
      success: true,
      message: "Modules fetched successfully",
      data: {
        companyModules: companyModulesWithAnalytics,
        globalModules: globalModulesWithAnalytics,
        companyName: company.name,
        companyId: session.companyId,
        stats: {
          totalStaff,
          totalModules: companyModules.length + globalModules.length,
          companyModulesCount: companyModules.length,
          globalModulesCount: globalModules.length,
        },
      },
    };
  } catch (error: any) {
    console.error("Get company modules error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch modules",
    };
  }
}
