import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Define User Schema inline for seeding
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["SUPER_ADMIN", "COMPANY_ADMIN", "TRAINEE"], default: "TRAINEE" },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
  name: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env.local");
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: "hexerve@hexerve.com" });

    if (existingAdmin) {
      console.log("ℹ️  Super admin already exists. Skipping seed.");
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("1234", 12);

    // Create super admin
    const superAdmin = await User.create({
      name: "Hexerve",
      email: "hexerve@hexerve.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      companyId: null, // Super admin has no company
    });

    console.log("✅ Super admin user created successfully!");
    console.log("📧 Email: hexerve@hexerve.com");
    console.log("🔑 Password: 1234");
    console.log("👤 Name: Hexerve");
    console.log("🛡️  Role: SUPER_ADMIN");

    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();

