import { NextResponse } from "next/server";
import { mockServer } from "@/lib/mock-server-state";

// GET /api/v1/setup — first-run status (open).
export async function GET() {
  return NextResponse.json({
    claimed: mockServer.claimed || mockServer.demo,
    demo: mockServer.demo,
    requiresAuth: false,
    version: mockServer.version,
  });
}
