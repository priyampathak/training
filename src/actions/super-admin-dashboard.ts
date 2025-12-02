"use server";

import connectDB from "@/src/lib/db";
import User from "@/src/models/User";
import Company from "@/src/models/Company";
import TrainingModule from "@/src/models/TrainingModule";
import ModuleProgress from "@/src/models/ModuleProgress";
import Plan from "@/src/models/Plan";
import { getSession } from "./auth";

// Dynamic imports for Mongoose models
async function getModels() {
  return { User, Company, TrainingModule, ModuleProgress, Plan };
}

export async function getSuperAdminDashboard() {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    const { User, Company, TrainingModule, ModuleProgress, Plan } = await getModels();
    await connectDB();

    // 1. Companies Overview
    const totalCompanies = await Company.countDocuments({ isDeleted: false });
    const activeCompanies = await Company.countDocuments({
      isDeleted: false,
      "subscription.status": "ACTIVE",
    });
    const inactiveCompanies = totalCompanies - activeCompanies;

    // 2. Users Overview
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const superAdmins = await User.countDocuments({
      isDeleted: false,
      role: "SUPER_ADMIN",
    });
    const companyAdmins = await User.countDocuments({
      isDeleted: false,
      role: "COMPANY_ADMIN",
    });
    const staff = await User.countDocuments({
      isDeleted: false,
      role: "STAFF",
    });
    const activeUsers = await User.countDocuments({
      isDeleted: false,
      isActive: true,
    });
    const inactiveUsers = totalUsers - activeUsers;

    // 3. Training Modules Overview
    const totalModules = await TrainingModule.countDocuments({ isActive: true });
    const globalModules = await TrainingModule.countDocuments({
      isActive: true,
      isGlobal: true,
    });
    const companyModules = await TrainingModule.countDocuments({
      isActive: true,
      isGlobal: false,
    });

    // 4. Plans Overview
    const totalPlans = await Plan.countDocuments({ isActive: true });
    const totalRevenue = await Company.aggregate([
      { $match: { isDeleted: false, "subscription.status": "ACTIVE" } },
      {
        $lookup: {
          from: "plans",
          localField: "subscription.planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$plan.price", 0] } },
        },
      },
    ]);

    const estimatedRevenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // 5. Progress & Engagement
    const totalProgress = await ModuleProgress.countDocuments();
    const completedProgress = await ModuleProgress.countDocuments({
      status: "COMPLETED",
    });
    const inProgressProgress = await ModuleProgress.countDocuments({
      status: "IN_PROGRESS",
    });
    const passedProgress = await ModuleProgress.countDocuments({
      isPassed: true,
      status: "COMPLETED",
    });

    const overallCompletionRate =
      totalProgress > 0
        ? Math.round((completedProgress / totalProgress) * 100)
        : 0;

    const overallPassRate =
      completedProgress > 0
        ? Math.round((passedProgress / completedProgress) * 100)
        : 0;

    // Calculate average score across all completed modules
    const avgScoreResult = await ModuleProgress.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$percentage" },
        },
      },
    ]);

    const averageScore =
      avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // 6. Top Performing Companies (by completion rate)
    const topCompanies = await ModuleProgress.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: "$companyId",
          completedCount: { $sum: 1 },
          avgScore: { $avg: "$percentage" },
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: "$company" },
      {
        $project: {
          _id: 0,
          companyId: "$_id",
          companyName: "$company.name",
          completedCount: 1,
          avgScore: { $round: ["$avgScore", 0] },
        },
      },
      { $sort: { completedCount: -1, avgScore: -1 } },
      { $limit: 5 },
    ]);

    // 7. Recent Activity (last 10 completions across all companies)
    const recentActivity = await ModuleProgress.find({
      status: "COMPLETED",
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .populate("moduleId", "meta.title")
      .populate("companyId", "name")
      .lean();

    const formattedRecentActivity = recentActivity.map((activity: any) => ({
      _id: activity._id.toString(),
      userName: activity.userId?.name || "Unknown User",
      userEmail: activity.userId?.email || "N/A",
      companyName: activity.companyId?.name || "N/A",
      moduleTitle: activity.moduleId?.meta?.title || "Unknown Module",
      score: activity.score,
      totalPoints: activity.totalPoints,
      percentage: activity.percentage,
      isPassed: activity.isPassed,
      completedAt: activity.completedAt,
    }));

    // 8. Module Stats (top 5 most completed modules globally)
    const topModules = await ModuleProgress.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: "$moduleId",
          completedCount: { $sum: 1 },
          avgScore: { $avg: "$percentage" },
          passedCount: {
            $sum: { $cond: [{ $eq: ["$isPassed", true] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "trainingmodules",
          localField: "_id",
          foreignField: "_id",
          as: "module",
        },
      },
      { $unwind: "$module" },
      {
        $project: {
          _id: 0,
          moduleId: "$_id",
          moduleTitle: "$module.meta.title",
          moduleType: { $cond: ["$module.isGlobal", "Global", "Company"] },
          completedCount: 1,
          avgScore: { $round: ["$avgScore", 0] },
          passRate: {
            $cond: [
              { $gt: ["$completedCount", 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ["$passedCount", "$completedCount"] }, 100] },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { completedCount: -1 } },
      { $limit: 5 },
    ]);

    // 9. Company Growth (companies added in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompanies = await Company.countDocuments({
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const recentUsers = await User.countDocuments({
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      success: true,
      message: "Super admin dashboard data fetched successfully",
      data: {
        overview: {
          totalCompanies,
          activeCompanies,
          inactiveCompanies,
          totalUsers,
          superAdmins,
          companyAdmins,
          staff,
          activeUsers,
          inactiveUsers,
          totalModules,
          globalModules,
          companyModules,
          totalPlans,
          estimatedRevenue,
          totalProgress,
          completedProgress,
          inProgressProgress,
          passedProgress,
          overallCompletionRate,
          overallPassRate,
          averageScore,
          recentCompanies,
          recentUsers,
        },
        topCompanies,
        recentActivity: formattedRecentActivity,
        topModules,
      },
    };
  } catch (error: any) {
    console.error("Get super admin dashboard error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch super admin dashboard data",
    };
  }
}

export async function getSuperAdminAnalytics(timeFilter?: string) {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    const { User, Company, TrainingModule, ModuleProgress, Plan } = await getModels();
    await connectDB();

    // Calculate date range based on time filter
    const now = new Date();
    let startDate: Date | null = null;

    switch (timeFilter) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarterly":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6months":
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "yearly":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = null; // All time
    }

    // Create date filter for queries
    const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    // 1. Detailed Company Analytics
    const companies = await Company.find({ isDeleted: false, ...dateFilter })
      .select("name subscription limits createdAt")
      .lean();

    const companyAnalytics = await Promise.all(
      companies.map(async (company) => {
        const companyId = company._id;

        // Count users in this company
        const totalUsers = await User.countDocuments({
          companyId: companyId,
          isDeleted: false,
        });

        const activeUsers = await User.countDocuments({
          companyId: companyId,
          isDeleted: false,
          isActive: true,
        });

        // Get assigned modules (company-specific + global)
        const companyModules = await TrainingModule.countDocuments({
          assignedCompanyId: companyId,
          isActive: true,
        });

        const globalModules = await TrainingModule.countDocuments({
          isGlobal: true,
          isActive: true,
        });

        const totalModules = companyModules + globalModules;

        // Get progress stats (with date filter on completedAt for completed modules)
        const progressDateFilter = startDate ? { completedAt: { $gte: startDate } } : {};
        
        const completedProgress = await ModuleProgress.countDocuments({
          companyId: companyId,
          status: "COMPLETED",
          ...progressDateFilter,
        });

        const inProgressProgress = await ModuleProgress.countDocuments({
          companyId: companyId,
          status: "IN_PROGRESS",
        });

        const passedProgress = await ModuleProgress.countDocuments({
          companyId: companyId,
          status: "COMPLETED",
          isPassed: true,
          ...progressDateFilter,
        });

        const totalProgress = completedProgress + inProgressProgress;

        const completionRate =
          totalProgress > 0
            ? Math.round((completedProgress / totalProgress) * 100)
            : 0;

        const passRate =
          completedProgress > 0
            ? Math.round((passedProgress / completedProgress) * 100)
            : 0;

        // Average score
        const avgScoreMatchFilter: any = { companyId: companyId, status: "COMPLETED" };
        if (startDate) {
          avgScoreMatchFilter.completedAt = { $gte: startDate };
        }
        
        const avgScoreResult = await ModuleProgress.aggregate([
          { $match: avgScoreMatchFilter },
          {
            $group: {
              _id: null,
              avgScore: { $avg: "$percentage" },
            },
          },
        ]);

        const avgScore =
          avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

        // Engagement rate (users who started at least one module)
        const uniqueUsersWithProgress = await ModuleProgress.distinct("userId", {
          companyId: companyId,
        });

        const engagementRate =
          totalUsers > 0
            ? Math.round((uniqueUsersWithProgress.length / totalUsers) * 100)
            : 0;

        return {
          companyId: companyId.toString(),
          companyName: company.name,
          subscriptionStatus: company.subscription?.status || "N/A",
          planName: company.subscription?.planName || "N/A",
          totalUsers,
          activeUsers,
          totalModules,
          companyModules,
          globalModules,
          completedProgress,
          inProgressProgress,
          passedProgress,
          completionRate,
          passRate,
          avgScore,
          engagementRate,
          createdAt: company.createdAt,
        };
      })
    );

    // 2. User Analytics (all users)
    const allUsers = await User.find({ isDeleted: false, ...dateFilter })
      .select("name email role companyId isActive lastLoginAt createdAt")
      .populate("companyId", "name")
      .lean();

    const userAnalytics = await Promise.all(
      allUsers.map(async (user) => {
        const userId = user._id;

        const progressDateFilter = startDate ? { completedAt: { $gte: startDate } } : {};

        const completedModules = await ModuleProgress.countDocuments({
          userId: userId,
          status: "COMPLETED",
          ...progressDateFilter,
        });

        const inProgressModules = await ModuleProgress.countDocuments({
          userId: userId,
          status: "IN_PROGRESS",
        });

        const passedModules = await ModuleProgress.countDocuments({
          userId: userId,
          status: "COMPLETED",
          isPassed: true,
          ...progressDateFilter,
        });

        const totalAttempts = await ModuleProgress.countDocuments({
          userId: userId,
          ...(startDate ? { createdAt: { $gte: startDate } } : {}),
        });

        const userAvgScoreFilter: any = { userId: userId, status: "COMPLETED" };
        if (startDate) {
          userAvgScoreFilter.completedAt = { $gte: startDate };
        }

        const avgScoreResult = await ModuleProgress.aggregate([
          { $match: userAvgScoreFilter },
          {
            $group: {
              _id: null,
              avgScore: { $avg: "$percentage" },
            },
          },
        ]);

        const avgScore =
          avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

        return {
          userId: userId.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: (user.companyId as any)?.name || "N/A",
          isActive: user.isActive,
          completedModules,
          inProgressModules,
          passedModules,
          totalAttempts,
          avgScore,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        };
      })
    );

    // 3. Module Analytics (all modules created within time filter)
    const allModules = await TrainingModule.find({ isActive: true, ...dateFilter })
      .select("meta assignedCompanyId isGlobal assessment createdAt")
      .populate("assignedCompanyId", "name")
      .lean();

    const moduleAnalytics = await Promise.all(
      allModules.map(async (module) => {
        const moduleId = module._id;

        const progressDateFilter = startDate ? { completedAt: { $gte: startDate } } : {};
        const attemptDateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

        const totalAttempts = await ModuleProgress.countDocuments({
          moduleId: moduleId,
          ...attemptDateFilter,
        });

        const completedCount = await ModuleProgress.countDocuments({
          moduleId: moduleId,
          status: "COMPLETED",
          ...progressDateFilter,
        });

        const inProgressCount = await ModuleProgress.countDocuments({
          moduleId: moduleId,
          status: "IN_PROGRESS",
        });

        const passedCount = await ModuleProgress.countDocuments({
          moduleId: moduleId,
          status: "COMPLETED",
          isPassed: true,
          ...progressDateFilter,
        });

        const failedCount = completedCount - passedCount;

        const completionRate =
          totalAttempts > 0
            ? Math.round((completedCount / totalAttempts) * 100)
            : 0;

        const passRate =
          completedCount > 0
            ? Math.round((passedCount / completedCount) * 100)
            : 0;

        const moduleAvgScoreFilter: any = { moduleId: moduleId, status: "COMPLETED" };
        if (startDate) {
          moduleAvgScoreFilter.completedAt = { $gte: startDate };
        }

        const avgScoreResult = await ModuleProgress.aggregate([
          { $match: moduleAvgScoreFilter },
          {
            $group: {
              _id: null,
              avgScore: { $avg: "$percentage" },
            },
          },
        ]);

        const avgScore =
          avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

        return {
          moduleId: moduleId.toString(),
          title: module.meta.title,
          category: module.meta.category,
          difficulty: module.meta.difficulty,
          type: module.isGlobal ? "Global" : "Company",
          assignedTo: module.isGlobal
            ? "All Companies"
            : (module.assignedCompanyId as any)?.name || "N/A",
          totalPoints: module.assessment?.totalPoints || 0,
          passingPoints: module.assessment?.passingPoints || 0,
          totalAttempts,
          completedCount,
          inProgressCount,
          passedCount,
          failedCount,
          completionRate,
          passRate,
          avgScore,
          createdAt: module.createdAt,
        };
      })
    );

    // 4. Plan Analytics
    const planAnalytics = await Plan.find({ isActive: true })
      .select("name features usersLimit price")
      .lean();

    const planStats = await Promise.all(
      planAnalytics.map(async (plan) => {
        const companiesUsingPlan = await Company.countDocuments({
          isDeleted: false,
          "subscription.planId": plan._id,
        });

        const activeSubscriptions = await Company.countDocuments({
          isDeleted: false,
          "subscription.planId": plan._id,
          "subscription.status": "ACTIVE",
        });

        return {
          planId: plan._id.toString(),
          planName: plan.name,
          usersLimit: plan.usersLimit,
          price: plan.price,
          features: plan.features,
          companiesUsingPlan,
          activeSubscriptions,
          totalRevenue: activeSubscriptions * plan.price,
        };
      })
    );

    // 5. Revenue Analytics
    // Get all companies with active subscriptions
    const activeCompaniesWithPlans = await Company.find({
      isDeleted: false,
      "subscription.status": "ACTIVE",
      ...dateFilter,
    })
      .populate("subscription.planId")
      .lean();

    // Calculate total MRR (Monthly Recurring Revenue)
    const totalMRR = activeCompaniesWithPlans.reduce((sum, company) => {
      const plan = company.subscription?.planId as any;
      return sum + (plan?.price || 0);
    }, 0);

    // Calculate ARR (Annual Recurring Revenue)
    const totalARR = totalMRR * 12;

    // Revenue by plan
    const revenueByPlan = planStats.map((plan) => ({
      planName: plan.planName,
      activeSubscriptions: plan.activeSubscriptions,
      monthlyRevenue: plan.totalRevenue,
      annualRevenue: plan.totalRevenue * 12,
    }));

    // New subscriptions in time period (if filtered)
    const newSubscriptionsCount = startDate
      ? await Company.countDocuments({
          isDeleted: false,
          "subscription.status": "ACTIVE",
          createdAt: { $gte: startDate },
        })
      : 0;

    // Churned subscriptions (companies that became inactive in time period)
    const churnedSubscriptionsCount = startDate
      ? await Company.countDocuments({
          isDeleted: false,
          "subscription.status": { $ne: "ACTIVE" },
          updatedAt: { $gte: startDate },
        })
      : 0;

    // Average Revenue Per User (ARPU)
    const totalActiveSubscriptions = activeCompaniesWithPlans.length;
    const arpu = totalActiveSubscriptions > 0 ? totalMRR / totalActiveSubscriptions : 0;

    // Revenue by subscription status
    const allCompaniesWithStatus = await Company.find({ isDeleted: false, ...dateFilter })
      .populate("subscription.planId")
      .lean();

    const revenueByStatus = {
      active: 0,
      trial: 0,
      cancelled: 0,
      expired: 0,
    };

    allCompaniesWithStatus.forEach((company) => {
      const plan = company.subscription?.planId as any;
      const revenue = plan?.price || 0;
      const status = company.subscription?.status?.toLowerCase() || "cancelled";
      
      if (status === "active") revenueByStatus.active += revenue;
      else if (status === "trial") revenueByStatus.trial += revenue;
      else if (status === "cancelled") revenueByStatus.cancelled += revenue;
      else if (status === "expired") revenueByStatus.expired += revenue;
    });

    // Top revenue generating companies
    const topRevenueCompanies = activeCompaniesWithPlans
      .map((company) => {
        const plan = company.subscription?.planId as any;
        const subscription = company.subscription as any;
        return {
          companyId: company._id.toString(),
          companyName: company.name,
          planName: plan?.name || "N/A",
          monthlyRevenue: plan?.price || 0,
          annualRevenue: (plan?.price || 0) * 12,
          subscriptionStatus: subscription?.status || "N/A",
          startDate: subscription?.startDate || company.createdAt,
        };
      })
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
      .slice(0, 10);

    const revenueAnalytics = {
      totalMRR,
      totalARR,
      arpu: Math.round(arpu),
      totalActiveSubscriptions,
      newSubscriptions: newSubscriptionsCount,
      churnedSubscriptions: churnedSubscriptionsCount,
      churnRate: totalActiveSubscriptions > 0 
        ? Math.round((churnedSubscriptionsCount / totalActiveSubscriptions) * 100) 
        : 0,
      revenueByPlan,
      revenueByStatus,
      topRevenueCompanies,
    };

    return {
      success: true,
      message: "Super admin analytics fetched successfully",
      data: {
        companyAnalytics: companyAnalytics.sort(
          (a, b) => b.completedProgress - a.completedProgress
        ),
        userAnalytics: userAnalytics.sort((a, b) => b.avgScore - a.avgScore),
        moduleAnalytics: moduleAnalytics.sort(
          (a, b) => b.completedCount - a.completedCount
        ),
        planStats,
        revenueAnalytics,
      },
    };
  } catch (error: any) {
    console.error("Get super admin analytics error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch super admin analytics",
    };
  }
}

