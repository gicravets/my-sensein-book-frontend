import { NextRequest, NextResponse } from "next/server";
import { mockServer } from "@/lib/mock-server-state";

// POST /api/v1/setup/claim — create the admin key on a fresh server.
export async function POST(req: NextRequest) {
  if (mockServer.claimed || mockServer.demo) {
    return NextResponse.json({ error: "already set up" }, { status: 409 });
  }
  const body = await req.json().catch(() => ({}));
  const apiKey = (body.apiKey as string) || "demo-" + Math.random().toString(36).slice(2, 18);
  mockServer.claimed = true;
  return NextResponse.json({ apiKey, claimed: true }, { status: 201 });
}
