/**
 * Cleanup Orphan Progress Records
 * 
 * This script removes ModuleProgress records that reference deleted users.
 * Run this once to clean up existing orphaned data.
 * 
 * Usage: npx ts-node --esm scripts/cleanup-orphan-progress.ts
 */

import mongoose, { Schema, Model, Document } from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

// Define minimal schemas for cleanup
const UserSchema = new Schema({
  email: String,
  name: String,
});

const ModuleProgressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  moduleId: { type: Schema.Types.ObjectId, ref: "TrainingModule" },
  companyId: { type: Schema.Types.ObjectId, ref: "Company" },
  status: String,
});

async function cleanupOrphanProgress() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Connected to MongoDB");

    // Get or create models
    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    const ModuleProgress = mongoose.models.ModuleProgress || mongoose.model("ModuleProgress", ModuleProgressSchema);

    // Get all progress records
    const allProgress = await ModuleProgress.find({}).lean();
    console.log(`📊 Total progress records: ${allProgress.length}`);

    // Get all valid user IDs
    const allUsers = await User.find({}).select("_id").lean();
    const validUserIds = new Set(allUsers.map((u: any) => u._id.toString()));
    console.log(`👥 Total valid users: ${validUserIds.size}`);

    // Find orphaned progress records (userId doesn't exist in users collection)
    const orphanedProgressIds: string[] = [];
    
    for (const progress of allProgress) {
      const p = progress as any;
      const userId = p.userId?.toString();
      if (!userId || !validUserIds.has(userId)) {
        orphanedProgressIds.push(p._id.toString());
      }
    }

    console.log(`🔍 Found ${orphanedProgressIds.length} orphaned progress records`);

    if (orphanedProgressIds.length > 0) {
      // Delete orphaned records
      const result = await ModuleProgress.deleteMany({
        _id: { $in: orphanedProgressIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
      
      console.log(`🗑️ Deleted ${result.deletedCount} orphaned progress records`);
    } else {
      console.log("✅ No orphaned records found - database is clean!");
    }

    // Verify cleanup
    const remainingProgress = await ModuleProgress.countDocuments();
    console.log(`📊 Remaining progress records: ${remainingProgress}`);

    await mongoose.disconnect();
    console.log("✅ Cleanup complete!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupOrphanProgress();

