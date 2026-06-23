import { NextRequest, NextResponse } from "next/server";
import { books } from "@/lib/mock-data";

// POST /api/v1/books/:id/enrich — mock has no external provider; returns the book unchanged.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({ book, enriched: false });
}
