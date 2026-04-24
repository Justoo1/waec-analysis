import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const parserUrl =
    process.env.PARSER_SERVICE_URL ?? "http://localhost:8000";

  try {
    const resp = await fetch(`${parserUrl}/api/parse/status/${taskId}`);
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json(
      { error: "Parser service unavailable" },
      { status: 502 }
    );
  }
}
