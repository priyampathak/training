import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import connectDB from "../src/lib/db";
import Company from "../src/models/Company";
import Plan from "../src/models/Plan";
import mongoose from "mongoose";

async function fixCompanyPlans() {
  await connectDB();
  console.log("🌱 Connecting to MongoDB...");

  try {
    const companies = await Company.find({});
    console.log(`\n📋 Found ${companies.length} companies\n`);

    if (companies.length === 0) {
      console.log("No companies found in database.");
      return;
    }

    const basicPlan = await Plan.findOne({ name: "Basic" });
    
    if (!basicPlan) {
      console.log("❌ Basic plan not found in database. Please seed it first.");
      return;
    }

    for (const company of companies) {
      console.log(`Updating: ${company.name}`);
      
      // Check if planName exists
      if (!company.subscription.planName) {
        company.subscription.planName = basicPlan.name;
        company.subscription.planId = basicPlan._id;
        await company.save();
        console.log(`  ✅ Updated to plan: ${basicPlan.name}`);
      } else {
        console.log(`  ✓ Already has plan: ${company.subscription.planName}`);
      }
    }

    console.log("\n✅ All companies updated successfully!");

  } catch (error) {
    console.error("❌ Error fixing company plans:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔒 Connection closed");
  }
}

fixCompanyPlans();

