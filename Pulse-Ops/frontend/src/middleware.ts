import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ONBOARDED_COOKIE = "pulse_onboarded";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isOnboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "true";

  // ─── Dashboard guard ──────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    // Cookie explicitly "false" → force onboarding
    if (!isOnboarded && request.cookies.get(ONBOARDED_COOKIE)) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // ─── Onboarding guard ─────────────────────────────────────────────
  if (pathname.startsWith("/onboarding")) {
    // ?reset=1 clears the onboarded cookie and lets the user restart
    if (searchParams.get("reset") === "1") {
      const res = NextResponse.next();
      res.cookies.set(ONBOARDED_COOKIE, "false", { path: "/", maxAge: 0 });
      return res;
    }
    // Already onboarded and not requesting a reset → send to dashboard
    if (isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
