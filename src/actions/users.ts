"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/db";
import User, { UserRole } from "@/src/models/User";
import Company from "@/src/models/Company";
import { getSession } from "./auth";
import mongoose from "mongoose";

// Validation Schema
const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "COMPANY_ADMIN", "STAFF"]),
  companyId: z.string().optional(),
  designation: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["SUPER_ADMIN", "COMPANY_ADMIN", "STAFF"]).optional(),
  companyId: z.string().optional(),
  designation: z.string().optional(),
  isActive: z.boolean().optional(),
});

interface UserResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * GET CURRENT USER INFO
 */
export async function getCurrentUser(): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    return {
      success: true,
      message: "Current user fetched successfully",
      data: {
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return {
      success: false,
      message: "An error occurred",
    };
  }
}

/**
 * GET ALL USERS (Super Admin Only)
 */
export async function getAllUsers(): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    await connectDB();

    // Fetch all users with company details
    const users = await User.find({})
      .populate({
        path: "companyId",
        select: "name slug",
        match: { isDeleted: false }, // Only populate non-deleted companies
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Users fetched successfully",
      data: users.map(user => ({
        ...user,
        _id: user._id.toString(),
        companyId: user.companyId ? (user.companyId as any)._id?.toString() : null,
        companyName: user.companyId ? (user.companyId as any).name : null,
      })),
    };
  } catch (error) {
    console.error("Get users error:", error);
    return {
      success: false,
      message: "An error occurred while fetching users",
    };
  }
}

/**
 * CREATE USER (Super Admin Only)
 */
export async function createUser(
  data: z.infer<typeof createUserSchema>
): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate input
    const validation = createUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    await connectDB();

    // Check if email already exists
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });
    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Validate company if provided
    if (data.companyId) {
      const company = await Company.findById(data.companyId);
      if (!company) {
        return {
          success: false,
          message: "Company not found",
        };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Prepare user data
    const userData: any = {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
      isActive: true,
      isDeleted: false,
    };

    // Only add companyId if provided and valid
    if (data.companyId && data.companyId.trim() !== "") {
      userData.companyId = new mongoose.Types.ObjectId(data.companyId);
    } else {
      userData.companyId = null; // Explicitly set to null if not provided
    }

    // Only add designation if provided
    if (data.designation && data.designation.trim() !== "") {
      userData.designation = data.designation;
    }

    // Create user
    const user = await User.create(userData);

    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message: "User created successfully",
      data: {
        userId: user._id.toString(),
        email: user.email,
      },
    };
  } catch (error: any) {
    console.error("Create user error:", error);
    
    // Check for specific error types
    if (error.code === 11000) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }
    
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0] as any;
      return {
        success: false,
        message: firstError?.message || "Validation error",
      };
    }

    return {
      success: false,
      message: "An error occurred while creating the user",
    };
  }
}

/**
 * UPDATE USER (Super Admin Only)
 */
export async function updateUser(
  userId: string,
  data: z.infer<typeof updateUserSchema>
): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate input
    const validation = updateUserSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    await connectDB();

    // Check if email already exists (if email is being updated)
    if (data.email) {
      const existingUser = await User.findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }
    }

    // Validate company if provided
    if (data.companyId) {
      const company = await Company.findById(data.companyId);
      if (!company) {
        return {
          success: false,
          message: "Company not found",
        };
      }
    }

    // Update user
    const updateData: any = { ...data };
    if (data.companyId) {
      updateData.companyId = new mongoose.Types.ObjectId(data.companyId);
    }
    if (data.email) {
      updateData.email = data.email.toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message: "User updated successfully",
      data: {
        userId: updatedUser._id.toString(),
        email: updatedUser.email,
      },
    };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      message: "An error occurred while updating the user",
    };
  }
}

/**
 * DELETE USER (Permanent Delete - Super Admin Only)
 */
export async function deleteUser(userId: string): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Prevent self-deletion
    if (session.userId === userId) {
      return {
        success: false,
        message: "You cannot delete your own account",
      };
    }

    await connectDB();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Delete user's ModuleProgress records first (cleanup related data)
    const ModuleProgress = (await import("@/src/models/ModuleProgress")).default;
    const deletedProgressCount = await ModuleProgress.deleteMany({ userId: userId });
    console.log(`🧹 Deleted ${deletedProgressCount.deletedCount} progress records for user ${userId}`);

    // Permanently delete user from database
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return {
        success: false,
        message: "Failed to delete user",
      };
    }

    revalidatePath("/dashboard/admin/users");
    revalidatePath("/dashboard/company/training");

    return {
      success: true,
      message: `User and ${deletedProgressCount.deletedCount} progress records permanently deleted`,
      data: {
        userId: deletedUser._id.toString(),
        email: deletedUser.email,
        role: deletedUser.role,
      },
    };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      success: false,
      message: "An error occurred while deleting user",
    };
  }
}

/**
 * TOGGLE USER ACTIVE STATUS (Super Admin Only)
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    await connectDB();

    await User.findByIdAndUpdate(userId, {
      isActive,
    });

    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return {
      success: false,
      message: "An error occurred while updating user status",
    };
  }
}

/**
 * RESET USER PASSWORD (Super Admin Only)
 * Allows Super Admin to set a new password for any user without requiring the old password
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<UserResponse> {
  try {
    const session = await getSession();

    if (!session || session.role !== "SUPER_ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Super admin access required.",
      };
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters",
      };
    }

    await connectDB();

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Hash the new password using the same encryption as user creation
    // Using bcrypt with salt rounds = 12 (same as in createUser)
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    revalidatePath("/dashboard/admin/users");

    console.log(`✅ Password reset for user: ${user.email}`);

    return {
      success: true,
      message: `Password reset successfully for ${user.name}`,
      data: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: error.message || "An error occurred while resetting password",
    };
  }
}
