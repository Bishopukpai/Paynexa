import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const REFERRAL_COOKIE_NAME = "paynexa_ref";
const COOKIE_MAX_AGE_DAYS = 30;

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // --- 1. REFERRAL TRACKING LOGIC (Public) ---
  const refCode = searchParams.get("ref");
  
  // Prepare base response object
  let response = NextResponse.next();

  // If a referral code is present in the URL query string
  if (refCode) {
    const sanitizedCode = refCode.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    if (sanitizedCode.length > 0) {
      // Set the referral cookie on the response
      response.cookies.set({
        name: REFERRAL_COOKIE_NAME,
        value: sanitizedCode,
        maxAge: 60 * 60 * 24 * COOKIE_MAX_AGE_DAYS, // 30 days in seconds
        path: "/",
        httpOnly: false, // Set to false so client-side code can access if needed
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  // --- 2. ADMIN PROTECTED ROUTE LOGIC (NextAuth Check) ---
  if (pathname.startsWith("/affiliate/admin")) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    const isAdmin = token?.role === "admin";

    // Unauthenticated or non-admin users attempting to access admin paths
    if (!token || !isAdmin) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "Forbidden");
      
      // Preserve referral cookie if it was just created during redirect
      const redirectResponse = NextResponse.redirect(loginUrl);
      if (refCode) {
        const existingCookie = response.cookies.get(REFERRAL_COOKIE_NAME);
        if (existingCookie) {
          redirectResponse.cookies.set(existingCookie);
        }
      }
      return redirectResponse;
    }
  }

  return response;
}

// Config matcher to handle both public landing/auth pages and restricted admin routes
export const config = {
  matcher: [
    /*
     * Match all requests except:
     * - API routes (/api/*)
     * - Static assets (_next/static, _next/image, favicon.ico, images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};