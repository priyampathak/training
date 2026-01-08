"use server";

import { getSession } from "./auth";

// Dynamic imports to prevent Mongoose models from being bundled in client
async function getModels() {
  const connectDB = (await import("@/src/lib/db")).default;
  const TrainingModule = (await import("@/src/models/TrainingModule")).default;
  const ModuleProgress = (await import("@/src/models/ModuleProgress")).default;
  const User = (await import("@/src/models/User")).default;
  await connectDB();
  return { TrainingModule, ModuleProgress, User };
}

interface QuizSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    score: number;
    totalPoints: number;
    percentage: number;
    isPassed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  };
}

/**
 * SUBMIT QUIZ ANSWERS AND CALCULATE SCORE
 */
export async function submitQuiz(
  moduleId: string,
  answers: Record<number, number>
): Promise<QuizSubmissionResponse> {
  try {
    console.log("📝 Submitting quiz for module:", moduleId);
    const session = await getSession();

    if (!session || session.role !== "STAFF") {
      return {
        success: false,
        message: "Unauthorized. Staff access required.",
      };
    }

    const { TrainingModule, ModuleProgress, User } = await getModels();

    // Get module details
    const module = await TrainingModule.findById(moduleId).lean();
    if (!module) {
      return { success: false, message: "Module not found" };
    }

    // Get user to find company
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Calculate score
    const quiz = (module as any).quiz || [];
    let score = 0;
    let correctAnswers = 0;

    // Check each answer (answers is already a plain object)
    quiz.forEach((question: any, index: number) => {
      const userAnswer = answers[index];
      if (userAnswer !== undefined && userAnswer === question.correctIndex) {
        score += question.points || 0;
        correctAnswers++;
      }
    });

    const totalPoints = (module as any).assessment?.totalPoints || 0;
    const passingPoints = (module as any).assessment?.passingPoints || 0;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const isPassed = score >= passingPoints;

    console.log(`✅ Score: ${score}/${totalPoints} (${percentage}%) - ${isPassed ? "PASSED" : "FAILED"}`);

    // Find or create progress record
    let progress = await ModuleProgress.findOne({
      userId: session.userId,
      moduleId: moduleId,
    });

    if (progress) {
      // Update existing progress
      progress.status = "COMPLETED";
      progress.score = score;
      progress.totalPoints = totalPoints;
      progress.percentage = percentage;
      progress.isPassed = isPassed;
      progress.attemptCount = (progress.attemptCount || 0) + 1;
      progress.answers = answers; // Plain object
      progress.lastAttemptAt = new Date();
      progress.completedAt = new Date();
      await progress.save();
    } else {
      // Create new progress record
      progress = await ModuleProgress.create({
        userId: session.userId,
        moduleId: moduleId,
        companyId: user.companyId,
        status: "COMPLETED",
        score: score,
        totalPoints: totalPoints,
        percentage: percentage,
        isPassed: isPassed,
        attemptCount: 1,
        answers: answers, // Plain object
        startedAt: new Date(),
        lastAttemptAt: new Date(),
        completedAt: new Date(),
      });
    }

    console.log("✅ Progress saved successfully");

    return {
      success: true,
      message: isPassed
        ? "Congratulations! You passed the test!"
        : "Test completed. Unfortunately, you did not pass. You can try again.",
      data: {
        score,
        totalPoints,
        percentage,
        isPassed,
        correctAnswers,
        totalQuestions: quiz.length,
      },
    };
  } catch (error: any) {
    console.error("❌ Submit quiz error:", error);
    return {
      success: false,
      message: error.message || "Failed to submit quiz",
    };
  }
}

/**
 * START MODULE (Mark as IN_PROGRESS)
 */
export async function startModule(moduleId: string): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getSession();

    if (!session || session.role !== "STAFF") {
      return {
        success: false,
        message: "Unauthorized. Staff access required.",
      };
    }

    const { ModuleProgress, User } = await getModels();

    // Get user to find company
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Check if progress already exists
    const existingProgress = await ModuleProgress.findOne({
      userId: session.userId,
      moduleId: moduleId,
    });

    if (!existingProgress) {
      // Create new progress record with IN_PROGRESS status
      await ModuleProgress.create({
        userId: session.userId,
        moduleId: moduleId,
        companyId: user.companyId,
        status: "IN_PROGRESS",
        score: 0,
        totalPoints: 0,
        percentage: 0,
        isPassed: false,
        attemptCount: 0,
        answers: {},
        startedAt: new Date(),
      });

      console.log("✅ Module started - progress created");
    } else if (existingProgress.status === "NOT_STARTED") {
      // Update status to IN_PROGRESS
      existingProgress.status = "IN_PROGRESS";
      existingProgress.startedAt = new Date();
      await existingProgress.save();

      console.log("✅ Module status updated to IN_PROGRESS");
    }

    return {
      success: true,
      message: "Module started successfully",
    };
  } catch (error: any) {
    console.error("❌ Start module error:", error);
    return {
      success: false,
      message: error.message || "Failed to start module",
    };
  }
}

