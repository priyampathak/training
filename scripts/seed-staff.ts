import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Define schemas inline for seeding
const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    features: [{ type: String }],
    usersLimit: { type: Number, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    branding: {
      primaryColor: { type: String, default: "#0F172A" },
    },
    contactEmail: { type: String, required: true },
    subscription: {
      planType: { type: String, required: true },
      planName: { type: String, required: true },
      status: { type: String, enum: ["ACTIVE", "PAST_DUE", "CANCELLED"], default: "ACTIVE" },
      validTill: { type: Date },
    },
    limits: {
      maxStaff: { type: Number, default: 5 },
      maxStorageMB: { type: Number, default: 500 },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "COMPANY_ADMIN", "STAFF"],
      default: "STAFF",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    designation: { type: String },
    lastLoginAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const TrainingModuleSchema = new mongoose.Schema(
  {
    assignedCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isGlobal: { type: Boolean, default: true },
    meta: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      category: {
        type: String,
        required: true,
        enum: ["IT & Security", "Communication", "Management", "HR"],
      },
      tags: [{ type: String }],
      difficulty: {
        type: String,
        enum: ["ROOKIE", "PRO", "LEGEND"],
        default: "ROOKIE",
      },
    },
    slides: [
      {
        heading: { type: String, required: true },
        content: { type: String, required: true },
        mediaUrl: { type: String },
        layout: {
          type: String,
          enum: ["SPLIT_IMAGE_RIGHT", "SPLIT_IMAGE_LEFT", "FULL_WIDTH", "IMAGE_TOP"],
          default: "SPLIT_IMAGE_RIGHT",
        },
        order: { type: Number, required: true },
      },
    ],
    display: {
      headingFontSize: { type: Number, default: 32, min: 16, max: 60 },
      contentFontSize: { type: Number, default: 16, min: 12, max: 32 },
    },
    quiz: [
      {
        question: { type: String, required: true },
        options: {
          type: [String],
          required: true,
          validate: {
            validator: function (v: string[]) {
              return v.length === 4;
            },
            message: "Quiz must have exactly 4 options",
          },
        },
        correctIndex: { type: Number, required: true, min: 0, max: 3 },
        points: { type: Number, required: true, min: 1, default: 10 },
      },
    ],
    assessment: {
      totalPoints: { type: Number, required: true, min: 0 },
      passingPoints: { type: Number, required: true, min: 0 },
      passingPercentage: { type: Number, min: 0, max: 100 },
    },
    settings: {
      isMandatory: { type: Boolean, default: false },
      timeLimit: { type: Number, min: 1 },
      attemptsAllowed: { type: Number, default: -1 },
      certificateEnabled: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
const Company = mongoose.models.Company || mongoose.model("Company", CompanySchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const TrainingModule = mongoose.models.TrainingModule || mongoose.model("TrainingModule", TrainingModuleSchema);

async function seedStaffData() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env.local");
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Seed Plan
    console.log("\n📦 Seeding Plan...");
    let plan = await Plan.findOne({ name: "Basic" });
    if (!plan) {
      plan = await Plan.create({
        name: "Basic",
        features: ["10 Users", "15 training modules/month"],
        usersLimit: 10,
        price: 199,
        isActive: true,
      });
      console.log("✅ Basic Plan created");
    } else {
      console.log("ℹ️  Basic Plan already exists");
    }

    // 2. Seed Super Admin (if not exists)
    console.log("\n👤 Checking Super Admin...");
    let superAdmin = await User.findOne({ email: "hexerve@hexerve.com" });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash("1234", 12);
      superAdmin = await User.create({
        name: "Hexerve",
        email: "hexerve@hexerve.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        companyId: null,
      });
      console.log("✅ Super Admin created");
    } else {
      console.log("ℹ️  Super Admin already exists");
    }

    // 3. Seed Company
    console.log("\n🏢 Seeding Company...");
    let company = await Company.findOne({ slug: "acme-corp" });
    if (!company) {
      company = await Company.create({
        name: "Acme Corporation",
        slug: "acme-corp",
        contactEmail: "contact@acme-corp.com",
        branding: {
          primaryColor: "#0F172A",
        },
        subscription: {
          planType: "STARTER",
          planName: plan.name,
          status: "ACTIVE",
          validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        limits: {
          maxStaff: plan.usersLimit,
          maxStorageMB: 500,
        },
        isDeleted: false,
      });
      console.log("✅ Acme Corporation created");
    } else {
      console.log("ℹ️  Acme Corporation already exists");
    }

    // 4. Seed Company Admin
    console.log("\n👤 Seeding Company Admin...");
    let companyAdmin = await User.findOne({ email: "admin@acme-corp.com" });
    if (!companyAdmin) {
      const hashedPassword = await bcrypt.hash("1234", 12);
      companyAdmin = await User.create({
        name: "John Admin",
        email: "admin@acme-corp.com",
        password: hashedPassword,
        role: "COMPANY_ADMIN",
        companyId: company._id,
        designation: "HR Manager",
        isActive: true,
      });
      console.log("✅ Company Admin created");
    } else {
      console.log("ℹ️  Company Admin already exists");
    }

    // 5. Seed Staff User
    console.log("\n👤 Seeding Staff User...");
    let staffUser = await User.findOne({ email: "staff@acme-corp.com" });
    if (!staffUser) {
      const hashedPassword = await bcrypt.hash("1234", 12);
      staffUser = await User.create({
        name: "Alice Staff",
        email: "staff@acme-corp.com",
        password: hashedPassword,
        role: "STAFF",
        companyId: company._id,
        designation: "Software Developer",
        isActive: true,
      });
      console.log("✅ Staff User created");
    } else {
      console.log("ℹ️  Staff User already exists");
    }

    // 6. Seed Training Modules
    console.log("\n📚 Seeding Training Modules...");

    // Global Module 1: Cybersecurity Basics
    const globalModule1 = await TrainingModule.findOne({
      "meta.title": "Cybersecurity Basics",
    });
    if (!globalModule1) {
      await TrainingModule.create({
        assignedCompanyId: null,
        isGlobal: true,
        meta: {
          title: "Cybersecurity Basics",
          description:
            "Learn fundamental cybersecurity principles to protect yourself and your organization from digital threats.",
          category: "IT & Security",
          tags: ["security", "cyber", "fundamentals"],
          difficulty: "ROOKIE",
        },
        slides: [
          {
            heading: "Welcome to Cybersecurity",
            content:
              "In today's digital world, cybersecurity is essential. This module will teach you the basics of protecting digital information and systems from unauthorized access and attacks.",
            mediaUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 0,
          },
          {
            heading: "Password Security",
            content:
              "Strong passwords are your first line of defense. Use a combination of uppercase and lowercase letters, numbers, and special characters. Never reuse passwords across multiple accounts.",
            mediaUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 1,
          },
          {
            heading: "Phishing Awareness",
            content:
              "Phishing attacks trick you into revealing sensitive information. Always verify sender addresses, look for suspicious links, and never share credentials via email.",
            mediaUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 2,
          },
        ],
        display: {
          headingFontSize: 32,
          contentFontSize: 16,
        },
        quiz: [
          {
            question: "What is the most important characteristic of a strong password?",
            options: [
              "It should be easy to remember",
              "It should contain a mix of characters, numbers, and symbols",
              "It should be the same across all accounts",
              "It should be your name and birthday",
            ],
            correctIndex: 1,
            points: 25,
          },
          {
            question: "What is phishing?",
            options: [
              "A type of computer virus",
              "A method to strengthen passwords",
              "An attempt to trick you into revealing sensitive information",
              "A legitimate email from your bank",
            ],
            correctIndex: 2,
            points: 25,
          },
        ],
        assessment: {
          totalPoints: 50,
          passingPoints: 35,
          passingPercentage: 70,
        },
        settings: {
          isMandatory: true,
          attemptsAllowed: -1,
        },
        isActive: true,
        createdBy: superAdmin._id,
      });
      console.log("✅ Global Module 1: Cybersecurity Basics created");
    } else {
      console.log("ℹ️  Cybersecurity Basics module already exists");
    }

    // Global Module 2: Effective Communication
    const globalModule2 = await TrainingModule.findOne({
      "meta.title": "Effective Communication in the Workplace",
    });
    if (!globalModule2) {
      await TrainingModule.create({
        assignedCompanyId: null,
        isGlobal: true,
        meta: {
          title: "Effective Communication in the Workplace",
          description:
            "Master essential communication skills to collaborate effectively with colleagues, managers, and clients.",
          category: "Communication",
          tags: ["communication", "teamwork", "collaboration"],
          difficulty: "ROOKIE",
        },
        slides: [
          {
            heading: "Communication Fundamentals",
            content:
              "Effective communication is the cornerstone of successful teamwork. Clear and concise messages help prevent misunderstandings and build strong professional relationships.",
            mediaUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 0,
          },
          {
            heading: "Active Listening",
            content:
              "Listening is as important as speaking. Pay full attention, ask clarifying questions, and provide feedback to show you understand the message being conveyed.",
            mediaUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 1,
          },
        ],
        display: {
          headingFontSize: 32,
          contentFontSize: 16,
        },
        quiz: [
          {
            question: "What is the most important aspect of active listening?",
            options: [
              "Preparing your response while the other person is talking",
              "Paying full attention and asking clarifying questions",
              "Interrupting to share your own experiences",
              "Checking your phone periodically",
            ],
            correctIndex: 1,
            points: 50,
          },
        ],
        assessment: {
          totalPoints: 50,
          passingPoints: 35,
          passingPercentage: 70,
        },
        settings: {
          isMandatory: false,
          attemptsAllowed: -1,
        },
        isActive: true,
        createdBy: superAdmin._id,
      });
      console.log("✅ Global Module 2: Effective Communication created");
    } else {
      console.log("ℹ️  Effective Communication module already exists");
    }

    // Company-Specific Module: Acme Corp Onboarding
    const companyModule = await TrainingModule.findOne({
      "meta.title": "Acme Corp Onboarding",
    });
    if (!companyModule) {
      await TrainingModule.create({
        assignedCompanyId: company._id,
        isGlobal: false,
        meta: {
          title: "Acme Corp Onboarding",
          description:
            "Welcome to Acme Corporation! Learn about our company culture, values, and essential policies in this comprehensive onboarding module.",
          category: "HR",
          tags: ["onboarding", "culture", "policies"],
          difficulty: "ROOKIE",
        },
        slides: [
          {
            heading: "Welcome to Acme",
            content:
              "Welcome to Acme Corporation! We're excited to have you join our team. This module will introduce you to our company mission, values, and what makes Acme a great place to work.",
            mediaUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 0,
          },
          {
            heading: "Our Core Values",
            content:
              "At Acme, we value innovation, collaboration, and integrity. These principles guide everything we do, from product development to customer service and employee interactions.",
            mediaUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 1,
          },
          {
            heading: "Company Policies",
            content:
              "Understanding our policies is crucial. This includes work hours, vacation time, remote work guidelines, and our code of conduct. Your manager will provide additional details specific to your role.",
            layout: "SPLIT_IMAGE_RIGHT",
            order: 2,
          },
        ],
        display: {
          headingFontSize: 32,
          contentFontSize: 16,
        },
        quiz: [
          {
            question: "Which of the following is NOT one of Acme's core values?",
            options: [
              "Innovation",
              "Collaboration",
              "Integrity",
              "Competition",
            ],
            correctIndex: 3,
            points: 100,
          },
        ],
        assessment: {
          totalPoints: 100,
          passingPoints: 70,
          passingPercentage: 70,
        },
        settings: {
          isMandatory: true,
          attemptsAllowed: -1,
        },
        isActive: true,
        createdBy: superAdmin._id,
      });
      console.log("✅ Company-Specific Module: Acme Corp Onboarding created");
    } else {
      console.log("ℹ️  Acme Corp Onboarding module already exists");
    }

    console.log("\n✅ All seed data created successfully!");
    console.log("\n📝 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Super Admin:");
    console.log("   Email: hexerve@hexerve.com");
    console.log("   Password: 1234");
    console.log("\n🔐 Company Admin (Acme Corp):");
    console.log("   Email: admin@acme-corp.com");
    console.log("   Password: 1234");
    console.log("\n🔐 Staff User (Acme Corp):");
    console.log("   Email: staff@acme-corp.com");
    console.log("   Password: 1234");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedStaffData();

