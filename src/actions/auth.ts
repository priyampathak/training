"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import connectDB from "@/src/lib/db";
import User, { UserRole } from "@/src/models/User";
import { COOKIE_CONFIG, getSessionCookieOptions } from "@/src/lib/cookies";

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

interface SessionPayload {
  userId: string;
  role: UserRole;
  companyId: string | null;
  email: string;
  name: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  redirect?: string;
}

// Get JWT Secret
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return secret;
}

// Generate JWT Token
function generateToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: "7d",
  });
}

// Verify JWT Token
function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJWTSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * LOGIN ACTION
 * Validates credentials, generates JWT, stores in HttpOnly cookie
 */
export async function login(formData: FormData): Promise<AuthResponse> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Validate Input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0].message,
      };
    }

    // Connect to DB
    await connectDB();

    // Find User (with password field selected)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      return {
        success: false,
        message: "Account is inactive or deleted",
      };
    }

    // Verify Password (handle optional password for Google Auth users)
    if (!user.password) {
      return {
        success: false,
        message: "Password not set. Please use social login or reset password.",
      };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Create Session Payload
    const sessionPayload: SessionPayload = {
      userId: user._id.toString(),
      role: user.role,
      companyId: user.companyId?.toString() || null,
      email: user.email,
      name: user.name,
    };

    // Generate JWT
    const token = generateToken(sessionPayload);

    // Store in Cookie (Next.js 15 approach)
    try {
      const cookieStore = await cookies();
      const cookieOptions = getSessionCookieOptions();
      
      // Try setting cookie
      cookieStore.set(cookieOptions.name, token, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
        maxAge: cookieOptions.maxAge,
      });

      // Verify cookie was set
      const setCookie = cookieStore.get(cookieOptions.name);
      
      // Debug log in development
      console.log("🍪 Cookie setting attempt:", {
        name: cookieOptions.name,
        tokenLength: token.length,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        cookieWasSet: !!setCookie,
      });
      
      if (!setCookie) {
        console.error("❌ Cookie was not set immediately after setting");
      }
    } catch (error) {
      console.error("❌ Error setting cookie:", error);
      throw error;
    }

    // Determine redirect based on role
    let redirect = "/dashboard";
    if (user.role === "SUPER_ADMIN") {
      redirect = "/dashboard/admin";
    } else if (user.role === "COMPANY_ADMIN") {
      redirect = "/dashboard/company";
    } else if (user.role === "STAFF") {
      redirect = "/dashboard/learn";
    }

    return {
      success: true,
      message: "Login successful",
      redirect,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "An error occurred during login",
    };
  }
}

/**
 * LOGOUT ACTION
 * Destroys the session cookie
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_CONFIG.SESSION_TOKEN);
  
  // Debug log in development
  if (process.env.NODE_ENV === "development") {
    console.log("🍪 Cookie deleted:", COOKIE_CONFIG.SESSION_TOKEN);
  }
}

/**
 * GET SESSION
 * Verifies JWT and returns user data
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_CONFIG.SESSION_TOKEN);

    if (!token) {
      // Debug log in development
      if (process.env.NODE_ENV === "development") {
        console.log("🍪 No session cookie found");
      }
      return null;
    }

    const session = verifyToken(token.value);
    
    // Debug log in development
    if (process.env.NODE_ENV === "development" && session) {
      console.log("🍪 Session verified:", {
        userId: session.userId,
        role: session.role,
        email: session.email,
      });
    }

    return session;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("🍪 Session verification failed:", error);
    }
    return null;
  }
}

