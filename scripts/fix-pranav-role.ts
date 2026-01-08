import mongoose from "mongoose";
import User from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/?appName=Cluster0";

async function fixPranavRole() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find Pranav's user
    const user = await User.findOne({ email: "pranav@hexerve.com" });

    if (!user) {
      console.log("❌ User pranav@hexerve.com not found");
      await mongoose.connection.close();
      return;
    }

    console.log("\n📋 Current user details:");
    console.log({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      designation: user.designation,
    });

    // Update role to COMPANY_ADMIN if it's not already
    if (user.role !== "COMPANY_ADMIN") {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { role: "COMPANY_ADMIN" },
        { new: true }
      );

      console.log("\n✅ User role updated to COMPANY_ADMIN:");
      console.log({
        id: updatedUser!._id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        role: updatedUser!.role,
      });
    } else {
      console.log("\n✅ User already has COMPANY_ADMIN role");
    }

    console.log("\n✅ User is now ready to be assigned as company admin!");

    await mongoose.connection.close();
    console.log("🔒 Connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixPranavRole();

