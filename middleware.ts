import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { UserRole } from "@/src/models/User";
import { COOKIE_CONFIG } from "@/src/lib/cookies";

interface SessionPayload {
  userId: string;
  role: UserRole;
  companyId: string | null;
  email: string;
  name: string;
}

function verifyToken(token: string): SessionPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes but redirect logged-in users away from auth pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/debug-cookies") ||
    pathname.startsWith("/login-api")
  ) {
    return NextResponse.next();
  }

  // Check if user is trying to access login/register while logged in
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const token = request.cookies.get(COOKIE_CONFIG.SESSION_TOKEN)?.value;
    
    if (token) {
      const session = verifyToken(token);
      
      if (session) {
        // User is logged in, redirect to their dashboard
        console.log("🔄 Logged-in user trying to access auth page, redirecting to dashboard");
        
        if (session.role === "SUPER_ADMIN") {
          return NextResponse.redirect(new URL("/dashboard/admin", request.url));
        } else if (session.role === "COMPANY_ADMIN") {
          return NextResponse.redirect(new URL("/dashboard/company", request.url));
        } else if (session.role === "STAFF") {
          return NextResponse.redirect(new URL("/dashboard/learn", request.url));
        }
        
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    
    // Not logged in, allow access to login/register
    return NextResponse.next();
  }

  // Home page - redirect based on auth status
  if (pathname === "/") {
    const token = request.cookies.get(COOKIE_CONFIG.SESSION_TOKEN)?.value;
    
    if (token) {
      const session = verifyToken(token);
      
      if (session) {
        // Logged in, redirect to dashboard
        if (session.role === "SUPER_ADMIN") {
          return NextResponse.redirect(new URL("/dashboard/admin", request.url));
        } else if (session.role === "COMPANY_ADMIN") {
          return NextResponse.redirect(new URL("/dashboard/company", request.url));
        } else if (session.role === "STAFF") {
          return NextResponse.redirect(new URL("/dashboard/learn", request.url));
        }
      }
    }
    
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(COOKIE_CONFIG.SESSION_TOKEN)?.value;

    if (!token) {
      // No token -> Redirect to login
      console.log("🚫 No session token found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verify token
    const session = verifyToken(token);

    if (!session) {
      // Invalid token -> Clear cookie and redirect
      console.log("🚫 Invalid session token, clearing and redirecting");
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(COOKIE_CONFIG.SESSION_TOKEN);
      return response;
    }
    
    console.log("✅ Session valid for user:", session.email);

    // Role-based access control - Each role can only access their designated routes
    // SUPER_ADMIN → /dashboard/admin/*
    // COMPANY_ADMIN → /dashboard/company/*
    // STAFF → /dashboard/learn/*
    const { role } = session;

    // SUPER_ADMIN accessing company routes -> Redirect to admin
    if (
      role === "SUPER_ADMIN" &&
      (pathname.startsWith("/dashboard/company") ||
        pathname.startsWith("/dashboard/learn"))
    ) {
      return NextResponse.redirect(
        new URL("/dashboard/admin", request.url)
      );
    }

    // COMPANY_ADMIN accessing admin or learn routes -> Redirect to company
    if (
      role === "COMPANY_ADMIN" &&
      (pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/learn"))
    ) {
      return NextResponse.redirect(
        new URL("/dashboard/company", request.url)
      );
    }

    // STAFF accessing admin or company routes -> Redirect to learn
    if (
      role === "STAFF" &&
      (pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/company"))
    ) {
      return NextResponse.redirect(
        new URL("/dashboard/learn", request.url)
      );
    }

    // Root dashboard redirect based on role
    if (pathname === "/dashboard") {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(
          new URL("/dashboard/admin", request.url)
        );
      } else if (role === "COMPANY_ADMIN") {
        return NextResponse.redirect(
          new URL("/dashboard/company", request.url)
        );
      } else if (role === "STAFF") {
        return NextResponse.redirect(
          new URL("/dashboard/learn", request.url)
        );
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
