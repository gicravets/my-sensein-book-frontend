import { NextRequest, NextResponse } from "next/server";
import { highlights } from "@/lib/mock-data";

// PATCH/DELETE /api/v1/highlights/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = highlights.find((x) => x.id === id);
  if (!h) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const body = await req.json();
  if (body.note !== undefined) h.note = body.note;
  if (body.color !== undefined) h.color = body.color;
  return NextResponse.json(h);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = highlights.findIndex((x) => x.id === id);
  if (i >= 0) highlights.splice(i, 1);
  return new NextResponse(null, { status: 204 });
}
