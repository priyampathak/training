"use server";

import { z } from "zod";
import { getSession } from "./auth";
import bcrypt from "bcryptjs";

// Dynamic imports to prevent Mongoose models from being bundled in client
async function getModels() {
  const connectDB = (await import("@/src/lib/db")).default;
  const User = (await import("@/src/models/User")).default;
  const Company = (await import("@/src/models/Company")).default;
  await connectDB();
  return { User, Company };
}

// Zod Schema for creating team members
const createTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum(["COMPANY_ADMIN", "STAFF"], {
    errorMap: () => ({ message: "Role must be either Admin or Staff" }),
  }),
});

interface TeamResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET ALL TEAM MEMBERS (Company Admin Only)
 */
export async function getTeamMembers(): Promise<TeamResponse> {
  try {
    console.log("🔍 Getting team members...");
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      console.error("❌ Unauthorized access attempt");
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      console.error("❌ No company assigned to admin");
      return { success: false, message: "No company assigned" };
    }

    console.log("✅ Session valid, company ID:", session.companyId);
    const { User, Company } = await getModels();

    // Get company details
    const company = await Company.findById(session.companyId)
      .select("name")
      .lean();

    if (!company) {
      return { success: false, message: "Company not found" };
    }

    // Get all team members for this company
    const teamMembers = await User.find({
      companyId: session.companyId,
      isDeleted: false,
    })
      .select("name email role designation isActive lastLoginAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const serializedMembers = teamMembers.map((member: any) => ({
      _id: member._id.toString(),
      name: member.name,
      email: member.email,
      role: member.role,
      designation: member.designation || "N/A",
      isActive: member.isActive,
      lastLoginAt: member.lastLoginAt?.toISOString() || null,
      createdAt: member.createdAt?.toISOString() || null,
    }));

    console.log("✅ Team members fetched:", serializedMembers.length);

    return {
      success: true,
      message: "Team members fetched successfully",
      data: {
        companyName: company.name,
        members: serializedMembers,
      },
    };
  } catch (error: any) {
    console.error("❌ Get team members error:", error);
    console.error("Error stack:", error.stack);
    return {
      success: false,
      message: error.message || "Failed to fetch team members",
    };
  }
}

/**
 * ADD NEW TEAM MEMBER (Company Admin Only)
 */
export async function addTeamMember(
  data: z.infer<typeof createTeamMemberSchema>
): Promise<TeamResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Company admin access required.",
      };
    }

    if (!session.companyId) {
      return {
        success: false,
        message: "No company assigned to this admin",
      };
    }

    const { User, Company } = await getModels();

    // Validate input
    const validation = createTeamMemberSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      console.error("❌ Validation failed:", errors);
      return {
        success: false,
        message: `Validation failed: ${errors}`,
      };
    }

    // Verify company exists
    const company = await Company.findById(session.companyId);
    if (!company) {
      return {
        success: false,
        message: "Company not found",
      };
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create new team member
    const newMember = await User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      companyId: session.companyId,
      isActive: true,
      isDeleted: false,
    });

    return {
      success: true,
      message: `Team member added successfully as ${data.role === "COMPANY_ADMIN" ? "Admin" : "Staff"}`,
      data: {
        memberId: newMember._id.toString(),
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
      },
    };
  } catch (error: any) {
    console.error("Add team member error:", error);
    return {
      success: false,
      message: error.message || "An error occurred while adding team member",
    };
  }
}

/**
 * DELETE TEAM MEMBER (Company Admin Only)
 */
export async function deleteTeamMember(
  memberId: string
): Promise<TeamResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      return { success: false, message: "No company assigned" };
    }

    const { User } = await getModels();

    // Find the member
    const member = await User.findById(memberId);

    if (!member) {
      return { success: false, message: "Team member not found" };
    }

    // Verify the member belongs to this company
    if (member.companyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only delete members from your company",
      };
    }

    // Prevent self-deletion
    if (member._id.toString() === session.userId) {
      return {
        success: false,
        message: "You cannot delete yourself",
      };
    }

    // Hard delete
    await User.findByIdAndDelete(memberId);

    return {
      success: true,
      message: "Team member deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete team member error:", error);
    return {
      success: false,
      message: "Failed to delete team member",
    };
  }
}

/**
 * TOGGLE TEAM MEMBER STATUS (Company Admin Only)
 */
export async function toggleTeamMemberStatus(
  memberId: string
): Promise<TeamResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      return { success: false, message: "No company assigned" };
    }

    const { User } = await getModels();

    // Find the member
    const member = await User.findById(memberId);

    if (!member) {
      return { success: false, message: "Team member not found" };
    }

    // Verify the member belongs to this company
    if (member.companyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only modify members from your company",
      };
    }

    // Prevent deactivating self
    if (member._id.toString() === session.userId) {
      return {
        success: false,
        message: "You cannot deactivate yourself",
      };
    }

    // Toggle status
    member.isActive = !member.isActive;
    await member.save();

    return {
      success: true,
      message: `Team member ${member.isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error: any) {
    console.error("Toggle team member status error:", error);
    return {
      success: false,
      message: "Failed to toggle team member status",
    };
  }
}

/**
 * RESET TEAM MEMBER PASSWORD (Company Admin Only)
 */
export async function resetTeamMemberPassword(
  memberId: string,
  newPassword: string
): Promise<TeamResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "COMPANY_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    if (!session.companyId) {
      return { success: false, message: "No company assigned" };
    }

    // Validate password
    if (!newPassword || newPassword.length < 4) {
      return {
        success: false,
        message: "Password must be at least 4 characters",
      };
    }

    const { User } = await getModels();

    // Find the member
    const member = await User.findById(memberId);

    if (!member) {
      return { success: false, message: "Team member not found" };
    }

    // Verify the member belongs to this company
    if (member.companyId?.toString() !== session.companyId) {
      return {
        success: false,
        message: "You can only reset passwords for members from your company",
      };
    }

    // Hash password using the same method as user creation
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    member.password = hashedPassword;
    await member.save();

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error: any) {
    console.error("Reset team member password error:", error);
    return {
      success: false,
      message: "Failed to reset password",
    };
  }
}

