import mongoose from "mongoose";
import User from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/?appName=Cluster0";

async function updateJohnRole() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Update John Doe to be Admin role
    const user = await User.findOneAndUpdate(
      { email: "john.doe@example.com" },
      { role: "COMPANY_ADMIN" },
      { new: true }
    );

    if (user) {
      console.log("✅ John Doe updated successfully:");
      console.log({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      console.log("⚠️  User not found");
    }

    await mongoose.connection.close();
    console.log("🔒 Connection closed");
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  }
}

updateJohnRole();

