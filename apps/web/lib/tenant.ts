import "server-only";
import { headers } from "next/headers";

/**
 * Extracts the tenant subdomain from the current request.
 * Reads x-tenant-subdomain set by proxy.ts, falling back to host header parsing.
 */
export async function getCurrentSubdomain(): Promise<string | null> {
  const headerStore = await headers();

  // proxy.ts sets this header; fastest path
  const fromProxy = headerStore.get("x-tenant-subdomain");
  if (fromProxy) return fromProxy;

  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";

  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "waecanalytics.com";

  if (host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.slice(0, -(baseDomain.length + 1)).split(":")[0];
    if (subdomain && !["www", "admin", "api"].includes(subdomain)) {
      return subdomain;
    }
  }

  // Local dev: apgss.localhost:3000
  if (host.includes(".localhost")) {
    const subdomain = host.split(".")[0];
    if (subdomain && !["www", "admin", "api"].includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}
