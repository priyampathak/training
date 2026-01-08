/**
 * Cookie Management Utilities
 * Centralized cookie handling for consistent behavior
 */

export const COOKIE_CONFIG = {
  SESSION_TOKEN: "session_token",
  MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  PATH: "/",
  SAME_SITE: "lax" as const, // 'lax' for better compatibility with redirects
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === "production",
};

/**
 * Cookie settings for session token
 */
export function getSessionCookieOptions() {
  return {
    name: COOKIE_CONFIG.SESSION_TOKEN,
    httpOnly: COOKIE_CONFIG.HTTP_ONLY,
    secure: COOKIE_CONFIG.SECURE,
    sameSite: COOKIE_CONFIG.SAME_SITE,
    path: COOKIE_CONFIG.PATH,
    maxAge: COOKIE_CONFIG.MAX_AGE,
  };
}

