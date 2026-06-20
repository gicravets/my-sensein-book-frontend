import { NextRequest, NextResponse } from "next/server";
import { bookmarks } from "@/lib/mock-data";

// DELETE /api/v1/bookmarks/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = bookmarks.findIndex((x) => x.id === id);
  if (i >= 0) bookmarks.splice(i, 1);
  return new NextResponse(null, { status: 204 });
}
