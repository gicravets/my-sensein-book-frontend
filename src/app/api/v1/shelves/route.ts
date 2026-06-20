import { NextResponse } from "next/server";
import { shelves } from "@/lib/mock-data";

// GET /api/v1/shelves
export async function GET() {
  return NextResponse.json({ content: shelves, totalElements: shelves.length });
}
