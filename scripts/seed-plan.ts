import mongoose from "mongoose";
import Plan from "../src/models/Plan.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hexerve_db_user:4KNdphmDjw2oUO8a@cluster0.hrty8cl.mongodb.net/?appName=Cluster0";

async function seedPlan() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if Basic plan already exists
    const existingPlan = await Plan.findOne({ name: "Basic" });
    if (existingPlan) {
      console.log("⚠️  Basic plan already exists");
      await mongoose.connection.close();
      return;
    }

    // Create Basic plan
    const basicPlan = await Plan.create({
      name: "Basic",
      features: ["10 Users", "15 training modules/month"],
      usersLimit: 10,
      price: 199,
      isActive: true,
      isDeleted: false,
    });

    console.log("✅ Basic plan created successfully:");
    console.log({
      id: basicPlan._id,
      name: basicPlan.name,
      features: basicPlan.features,
      usersLimit: basicPlan.usersLimit,
      price: basicPlan.price,
    });

    await mongoose.connection.close();
    console.log("🔒 Connection closed");
  } catch (error) {
    console.error("❌ Error seeding plan:", error);
    process.exit(1);
  }
}

seedPlan();

