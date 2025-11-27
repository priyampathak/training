import { z } from "zod";
import connectDB from "@/src/lib/db";
import TrainingModule from "@/src/models/TrainingModule";
import Company from "@/src/models/Company";
import User from "@/src/models/User";
import ModuleProgress from "@/src/models/ModuleProgress";
import { getSession } from "./auth";

interface StaffDashboardResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      name: string;
      email: string;
      designation?: string;
    };
    company: {
      name: string;
      planName: string;
      subscriptionStatus: string;
    } | null;
    stats: {
      totalModules: number;
      completedModules: number;
      inProgressModules: number;
      averageScore: number;
      completionRate: number;
    };
    availableModules: any[];
    completedModules: any[];
    inProgressModules: any[];
  };
}

/**
 * GET STAFF DASHBOARD DATA
 * Fetches all relevant information for the staff dashboard
 */
export async function getStaffDashboard(): Promise<StaffDashboardResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "STAFF") {
      return {
        success: false,
        message: "Unauthorized. Staff access required.",
      };
    }

    await connectDB();

    // Get user details
    const user = await User.findById(session.userId)
      .select("name email designation companyId")
      .lean();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Get company details if user is assigned to a company
    let companyData = null;
    if (user.companyId) {
      const company = await Company.findById(user.companyId)
        .select("name subscription.planName subscription.status")
        .lean();

      if (company) {
        companyData = {
          name: company.name,
          planName: company.subscription.planName,
          subscriptionStatus: company.subscription.status,
        };
      }
    }

    // Get available training modules
    // Modules are available if:
    // 1. They are global (isGlobal = true) OR
    // 2. They are assigned to the user's company (assignedCompanyId = user.companyId)
    // 3. They are active (isActive = true)
    
    const moduleQuery: any = {
      isActive: true,
      $or: [
        { isGlobal: true },
        { assignedCompanyId: user.companyId },
      ],
    };

    const availableModules = await TrainingModule.find(moduleQuery)
      .select("meta assignedCompanyId isGlobal assessment settings createdAt")
      .populate("assignedCompanyId", "name")
      .sort({ "meta.title": 1 })
      .lean();

    // Get user's progress for all modules
    const progressRecords = await ModuleProgress.find({
      userId: session.userId,
    }).lean();

    // Create a map of moduleId -> progress for easy lookup
    const progressMap = new Map();
    progressRecords.forEach((progress) => {
      progressMap.set(progress.moduleId.toString(), progress);
    });

    // Categorize modules based on progress
    const completedModulesList: any[] = [];
    const inProgressModulesList: any[] = [];
    const notStartedModulesList: any[] = [];

    let totalScore = 0;
    let completedCount = 0;

    availableModules.forEach((module: any) => {
      const moduleId = module._id.toString();
      const progress = progressMap.get(moduleId);

      const moduleData = {
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
        isGlobal: module.isGlobal,
        assignedCompanyName: module.assignedCompanyId
          ? (module.assignedCompanyId as any).name
          : "All Companies",
        progress: progress
          ? {
              status: progress.status,
              score: progress.score,
              percentage: progress.percentage,
              isPassed: progress.isPassed,
              attemptCount: progress.attemptCount,
              completedAt: progress.completedAt,
              lastAttemptAt: progress.lastAttemptAt,
            }
          : null,
      };

      if (progress) {
        if (progress.status === "COMPLETED") {
          completedModulesList.push(moduleData);
          totalScore += progress.percentage;
          completedCount++;
        } else if (progress.status === "IN_PROGRESS") {
          inProgressModulesList.push(moduleData);
        } else {
          notStartedModulesList.push(moduleData);
        }
      } else {
        notStartedModulesList.push(moduleData);
      }
    });

    const averageScore = completedCount > 0 ? totalScore / completedCount : 0;
    const completionRate =
      availableModules.length > 0
        ? (completedCount / availableModules.length) * 100
        : 0;

    return {
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        user: {
          name: user.name,
          email: user.email,
          designation: user.designation,
        },
        company: companyData,
        stats: {
          totalModules: availableModules.length,
          completedModules: completedCount,
          inProgressModules: inProgressModulesList.length,
          averageScore: Math.round(averageScore),
          completionRate: Math.round(completionRate),
        },
        availableModules: notStartedModulesList,
        completedModules: completedModulesList,
        inProgressModules: inProgressModulesList,
      },
    };
  } catch (error: any) {
    console.error("Get staff dashboard error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch dashboard data",
    };
  }
}

