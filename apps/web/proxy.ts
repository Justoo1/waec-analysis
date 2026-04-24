import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PATHS = [
  "/",
  "/results",
  "/subjects",
  "/university",
  "/compare",
  "/upload",
];
const AUTH_PATHS = ["/login", "/register"];
const SKIP_SUBDOMAINS = new Set(["www", "admin", "api"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "waecanalytics.com";
  const pathname = request.nextUrl.pathname;

  // ── 1. Extract subdomain ──────────────────────────────────────────────────
  let subdomain: string | null = null;

  if (host.endsWith(`.${baseDomain}`)) {
    const candidate = host.slice(0, -(baseDomain.length + 1)).split(":")[0];
    if (candidate && !SKIP_SUBDOMAINS.has(candidate)) {
      subdomain = candidate;
    }
  } else if (host.includes(".localhost")) {
    // Local dev: apgss.localhost:3000
    const candidate = host.split(".")[0];
    if (candidate && !SKIP_SUBDOMAINS.has(candidate)) {
      subdomain = candidate;
    }
  }

  // ── 2. No tenant subdomain → serve main domain normally ──────────────────
  if (!subdomain) {
    return NextResponse.next();
  }

  // ── 3. Propagate subdomain to Server Components via header ────────────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-subdomain", subdomain);

  // ── 4. Auth gate: protect dashboard routes ────────────────────────────────
  const isDashboardPath =
    pathname === "/" ||
    PROTECTED_PATHS.some((p) => p !== "/" && pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isDashboardPath || isAuthPath) {
    const session = await auth();

    if (isDashboardPath && !session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── 5. Redirect authenticated users away from login/register ───────────
    if (isAuthPath && session?.user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
