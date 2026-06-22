import { NextResponse } from "next/server";
import { mockServer } from "@/lib/mock-server-state";

// GET /api/v1/update — mock never reports an update (the Go backend checks GitHub).
export async function GET() {
  return NextResponse.json({
    current: mockServer.version,
    latest: "",
    updateAvailable: false,
    url: "",
  });
}
