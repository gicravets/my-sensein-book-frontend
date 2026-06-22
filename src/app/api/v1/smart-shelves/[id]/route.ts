import { NextRequest, NextResponse } from "next/server";
import { smartShelves } from "@/lib/mock-smart-shelves";

// DELETE /api/v1/smart-shelves/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = smartShelves.findIndex((s) => s.id === id);
  if (i >= 0) smartShelves.splice(i, 1);
  return new NextResponse(null, { status: 204 });
}
