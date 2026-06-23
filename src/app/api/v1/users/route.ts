import { NextRequest, NextResponse } from "next/server";
import { mockUsers } from "@/lib/mock-users";

// GET /api/v1/users — family users; POST — create one.
export async function GET() {
  return NextResponse.json({ content: mockUsers, totalElements: mockUsers.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const u = {
    id: "u-" + Math.random().toString(36).slice(2, 9),
    name: String(body.name ?? "user"),
    role: "member",
  };
  mockUsers.push(u);
  return NextResponse.json(u, { status: 201 });
}
