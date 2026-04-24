import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSchoolBySubdomain } from "@/lib/db/tenant";

export async function GET() {
  const headerStore = await headers();
  const subdomain = headerStore.get("x-tenant-subdomain");

  if (!subdomain) {
    return NextResponse.json({ error: "No tenant subdomain" }, { status: 400 });
  }

  const school = await getSchoolBySubdomain(subdomain);

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  return NextResponse.json({ school });
}
