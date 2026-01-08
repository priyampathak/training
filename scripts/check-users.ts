import mongoose from "mongoose";
import User from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/?appName=Cluster0";

async function checkUsers() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all users
    const users = await User.find({}).select("name email role companyId designation");

    console.log(`📋 Total users in database: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Company ID: ${user.companyId || "None"}`);
      console.log(`   Designation: ${user.designation || "None"}`);
      console.log(`   Can be company admin: ${user.role === "COMPANY_ADMIN" && !user.companyId ? "✅ YES" : "❌ NO"}`);
      console.log("");
    });

    // Check for users that can be assigned as company admin
    const availableAdmins = users.filter(u => u.role === "COMPANY_ADMIN" && !u.companyId);
    
    if (availableAdmins.length > 0) {
      console.log("\n✅ Users available to be assigned as company admin:");
      availableAdmins.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
    } else {
      console.log("\n⚠️  No users available to be assigned as company admin!");
      console.log("   Create a user with 'Admin' role first.");
    }

    await mongoose.connection.close();
    console.log("\n🔒 Connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkUsers();

