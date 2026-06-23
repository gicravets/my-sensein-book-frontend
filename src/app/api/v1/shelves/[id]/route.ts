import { NextRequest, NextResponse } from "next/server";
import { shelves } from "@/lib/mock-data";

// PATCH /api/v1/shelves/:id { isPublic } — share/unshare a shelf with the family.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sh = shelves.find((s) => s.id === id);
  if (!sh) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (typeof body.isPublic === "boolean") sh.isPublic = body.isPublic;
  return NextResponse.json(sh);
}
