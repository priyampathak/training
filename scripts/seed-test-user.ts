import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/?appName=Cluster0";

async function seedTestUser() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "john.doe@example.com" });
    if (existingUser) {
      console.log("⚠️  Test user already exists");
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Create test user as SUPER_ADMIN (doesn't require companyId)
    // Will be converted to COMPANY_ADMIN when assigned to a company
    const testUser = await User.create({
      name: "John Doe",
      email: "john.doe@example.com",
      password: hashedPassword,
      role: "SUPER_ADMIN", // Temporarily, will be updated to COMPANY_ADMIN
      designation: "Manager",
      isActive: true,
      isDeleted: false,
    });

    console.log("✅ Test user created successfully:");
    console.log({
      id: testUser._id,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
      designation: testUser.designation,
    });

    console.log("\n📝 Use this email when creating a company:");
    console.log("   Email: john.doe@example.com");

    await mongoose.connection.close();
    console.log("🔒 Connection closed");
  } catch (error) {
    console.error("❌ Error seeding test user:", error);
    process.exit(1);
  }
}

seedTestUser();

