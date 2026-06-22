import { NextRequest, NextResponse } from "next/server";
import { smartShelves } from "@/lib/mock-smart-shelves";

// GET /api/v1/smart-shelves — list; POST — create a rule-based shelf.
export async function GET() {
  return NextResponse.json({ content: smartShelves, totalElements: smartShelves.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sh = {
    id: "ss-" + Math.random().toString(36).slice(2, 9),
    name: String(body.name ?? "Shelf"),
    rules: body.rules ?? {},
  };
  smartShelves.push(sh);
  return NextResponse.json(sh, { status: 201 });
}
