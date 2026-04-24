import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolNumber = session.user.schoolNumber;
  if (!schoolNumber) {
    return NextResponse.json(
      { error: "No tenant associated with this account" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const sittingYear = formData.get("sitting_year");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!sittingYear) {
    return NextResponse.json(
      { error: "sitting_year is required" },
      { status: 400 }
    );
  }

  const parserUrl =
    process.env.PARSER_SERVICE_URL ?? "http://localhost:8000";

  const forward = new FormData();
  forward.append("file", file);
  forward.append("school_number", schoolNumber);
  forward.append("sitting_year", String(sittingYear));

  try {
    const resp = await fetch(`${parserUrl}/api/parse/upload`, {
      method: "POST",
      body: forward,
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json(
      { error: "Parser service unavailable" },
      { status: 502 }
    );
  }
}
