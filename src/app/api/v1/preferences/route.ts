import { NextRequest, NextResponse } from "next/server";

// GET/PUT /api/v1/preferences — per-user reader settings (theme/font/mode).
// Mock keeps them in-memory; the Go backend persists per user. Merge per key.
const prefs: Record<string, unknown> = {};

export async function GET() {
  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;
  for (const [k, v] of Object.entries(body)) prefs[k] = v;
  return NextResponse.json(prefs);
}
