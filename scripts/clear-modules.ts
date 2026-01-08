import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import connectDB from "../src/lib/db";
import TrainingModule from "../src/models/TrainingModule";
import mongoose from "mongoose";

async function clearModules() {
  await connectDB();
  console.log("🌱 Connecting to MongoDB...");

  try {
    const result = await TrainingModule.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} training modules`);
  } catch (error) {
    console.error("❌ Error clearing modules:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔒 Connection closed");
  }
}

clearModules();

