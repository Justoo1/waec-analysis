import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const maxDuration = 300;

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

  const url = new URL(request.url);
  const sittingYear = url.searchParams.get("sitting_year");
  if (!sittingYear) {
    return NextResponse.json(
      { error: "sitting_year is required" },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "Multipart form data required" },
      { status: 400 }
    );
  }

  const parserUrl =
    process.env.PARSER_SERVICE_URL ?? "http://localhost:8000";

  try {
    const resp = await fetch(
      `${parserUrl}/api/parse/upload?school_number=${encodeURIComponent(schoolNumber)}&sitting_year=${encodeURIComponent(sittingYear)}`,
      {
        method: "POST",
        body: request.body,
        headers: { "content-type": contentType },
        // @ts-expect-error — Node ≥18 requires duplex when body is a ReadableStream
        duplex: "half",
      }
    );

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json(
      { error: "Parser service unavailable" },
      { status: 502 }
    );
  }
}
