import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import connectDB from "../src/lib/db";
import TrainingModule from "../src/models/TrainingModule";
import User from "../src/models/User";
import mongoose from "mongoose";

async function seedSampleModule() {
  await connectDB();
  console.log("🌱 Connecting to MongoDB...");

  try {
    // Find the super admin user
    const superAdmin = await User.findOne({ role: "SUPER_ADMIN" });

    if (!superAdmin) {
      console.log("❌ No super admin user found. Please run seed script first.");
      return;
    }

    const existingModule = await TrainingModule.findOne({
      "meta.title": "Workplace Safety Fundamentals",
    });

    if (existingModule) {
      console.log("Sample module already exists. Skipping seed.");
      console.log({
        id: existingModule._id,
        title: existingModule.meta.title,
        category: existingModule.meta.category,
      });
      return;
    }

    const sampleModule = await TrainingModule.create({
      assignedCompanyId: null,
      isGlobal: true,
      meta: {
        title: "Workplace Safety Fundamentals",
        description:
          "A comprehensive introduction to workplace safety protocols, emergency procedures, and hazard identification. This course covers OSHA guidelines and best practices for maintaining a safe work environment.",
        category: "IT & Security",
        tags: ["safety", "compliance", "mandatory", "osha"],
        difficulty: "ROOKIE",
      },
      slides: [
        {
          heading: "Introduction to Workplace Safety",
          content:
            "Welcome to the Workplace Safety Fundamentals course. In this module, you will learn essential safety protocols and procedures.",
          mediaUrl: "",
          layout: "SPLIT_IMAGE_RIGHT",
          order: 0,
        },
        {
          heading: "Identifying Hazards",
          content:
            "Learn how to identify common workplace hazards including physical, chemical, biological, and ergonomic risks.",
          mediaUrl: "",
          layout: "SPLIT_IMAGE_RIGHT",
          order: 1,
        },
        {
          heading: "Emergency Procedures",
          content:
            "Understanding emergency evacuation routes, assembly points, and emergency contact procedures.",
          mediaUrl: "",
          layout: "SPLIT_IMAGE_RIGHT",
          order: 2,
        },
      ],
      quiz: [
        {
          question: "What does OSHA stand for?",
          options: [
            "Office Safety and Health Administration",
            "Occupational Safety and Health Administration",
            "Operational Safety and Hazard Analysis",
            "Occupational Standards and Health Agency",
          ],
          correctIndex: 1,
          points: 10,
        },
        {
          question:
            "What is the first step when you identify a workplace hazard?",
          options: [
            "Ignore it if it's not severe",
            "Report it to your supervisor immediately",
            "Try to fix it yourself",
            "Take a photo for social media",
          ],
          correctIndex: 1,
          points: 10,
        },
      ],
      assessment: {
        totalPoints: 20,
        passingPoints: 15,
        passingPercentage: 75,
      },
      settings: {
        isMandatory: true,
        attemptsAllowed: -1,
        certificateEnabled: false,
      },
      createdBy: superAdmin._id,
      isActive: true,
    });

    console.log("✅ Sample training module created successfully:");
    console.log({
      id: sampleModule._id,
      title: sampleModule.meta.title,
      category: sampleModule.meta.category,
      difficulty: sampleModule.meta.difficulty,
      slides: sampleModule.slides.length,
      quizQuestions: sampleModule.quiz?.length || 0,
      totalPoints: sampleModule.assessment.totalPoints,
      passingPoints: sampleModule.assessment.passingPoints,
      passingPercentage: sampleModule.assessment.passingPercentage,
    });
  } catch (error) {
    console.error("❌ Error seeding sample module:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔒 Connection closed");
  }
}

seedSampleModule();

