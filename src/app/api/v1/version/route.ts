import { NextResponse } from "next/server";
import { mockServer } from "@/lib/mock-server-state";

// GET /api/v1/version
export async function GET() {
  return NextResponse.json({ version: mockServer.version, demo: mockServer.demo });
}
