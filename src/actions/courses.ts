"use server";

import { z } from "zod";
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

interface CoursesResponse {
  success: boolean;
  message: string;
  data?: {
    companyModules: any[];
    globalModules: any[];
    companyName: string | null;
  };
}

/**
 * GET ALL AVAILABLE COURSES FOR STAFF
 * Returns company-specific and global training modules
 */
export async function getAvailableCourses(): Promise<CoursesResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "STAFF") {
      return {
        success: false,
        message: "Unauthorized. Staff access required.",
      };
    }

    const { User, Company, TrainingModule, ModuleProgress } = await getModels();

    // Get user details to find their company
    const user = await User.findById(session.userId)
      .populate("companyId", "name")
      .lean();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const companyName = user.companyId ? (user.companyId as any).name : null;

    // Get company-specific modules (if user has a company)
    let companyModules: any[] = [];
    if (user.companyId) {
      companyModules = await TrainingModule.find({
        assignedCompanyId: user.companyId,
        isGlobal: false,
        isActive: true,
      })
        .select("meta assignedCompanyId assessment settings display createdAt slides quiz")
        .populate("createdBy", "name")
        .sort({ "meta.title": 1 })
        .lean();
    }

    // Get global modules
    const globalModules = await TrainingModule.find({
      isGlobal: true,
      isActive: true,
    })
      .select("meta assignedCompanyId assessment settings display createdAt slides quiz")
      .populate("createdBy", "name")
      .sort({ "meta.title": 1 })
      .lean();

    // Get user's progress for all modules
    const progressRecords = await ModuleProgress.find({
      userId: session.userId,
    }).lean();

    // Create a map of moduleId -> progress
    const progressMap = new Map();
    progressRecords.forEach((progress) => {
      progressMap.set(progress.moduleId.toString(), progress);
    });

    // Add progress information to company modules
    const companyModulesWithProgress = companyModules.map((module: any) => {
      const moduleId = module._id.toString();
      const progress = progressMap.get(moduleId);

      // Serialize slides to ensure ObjectIds are converted to strings
      const serializedSlides = (module.slides || []).map((slide: any) => ({
        _id: slide._id?.toString(),
        heading: slide.heading,
        content: slide.content,
        mediaUrl: slide.mediaUrl,
        layout: slide.layout,
        order: slide.order,
      }));

      // Serialize quiz questions
      const serializedQuiz = (module.quiz || []).map((q: any) => ({
        _id: q._id?.toString(),
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        points: q.points,
      }));

      return {
        _id: moduleId,
        title: module.meta.title,
        description: module.meta.description,
        category: module.meta.category,
        difficulty: module.meta.difficulty,
        tags: module.meta.tags,
        totalPoints: module.assessment?.totalPoints || 0,
        passingPoints: module.assessment?.passingPoints || 0,
        passingPercentage: module.assessment?.passingPercentage || 0,
        isMandatory: module.settings?.isMandatory || false,
        slidesCount: module.slides?.length || 0,
        questionsCount: module.quiz?.length || 0,
        slides: serializedSlides,
        quiz: serializedQuiz,
        display: module.display || { headingFontSize: 32, contentFontSize: 16 },
        createdBy: module.createdBy?.name || "Unknown",
        createdAt: module.createdAt,
        progress: progress
          ? {
              status: progress.status,
              score: progress.score,
              percentage: progress.percentage,
              isPassed: progress.isPassed,
              attemptCount: progress.attemptCount,
              completedAt: progress.completedAt,
            }
          : null,
      };
    });

    // Add progress information to global modules
    const globalModulesWithProgress = globalModules.map((module: any) => {
      const moduleId = module._id.toString();
      const progress = progressMap.get(moduleId);

      // Serialize slides to ensure ObjectIds are converted to strings
      const serializedSlides = (module.slides || []).map((slide: any) => ({
        _id: slide._id?.toString(),
        heading: slide.heading,
        content: slide.content,
        mediaUrl: slide.mediaUrl,
        layout: slide.layout,
        order: slide.order,
      }));

      // Serialize quiz questions
      const serializedQuiz = (module.quiz || []).map((q: any) => ({
        _id: q._id?.toString(),
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        points: q.points,
      }));

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
        slides: serializedSlides,
        quiz: serializedQuiz,
        display: module.display || { headingFontSize: 32, contentFontSize: 16 },
        createdBy: module.createdBy?.name || "Unknown",
        createdAt: module.createdAt,
        progress: progress
          ? {
              status: progress.status,
              score: progress.score,
              percentage: progress.percentage,
              isPassed: progress.isPassed,
              attemptCount: progress.attemptCount,
              completedAt: progress.completedAt,
            }
          : null,
      };
    });

    return {
      success: true,
      message: "Courses fetched successfully",
      data: {
        companyModules: companyModulesWithProgress,
        globalModules: globalModulesWithProgress,
        companyName,
      },
    };
  } catch (error: any) {
    console.error("Get available courses error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch courses",
    };
  }
}

