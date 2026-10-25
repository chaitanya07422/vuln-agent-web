import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${API_BASE}/v1/scans`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}
