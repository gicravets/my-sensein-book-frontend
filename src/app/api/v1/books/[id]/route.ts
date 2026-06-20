import { NextRequest, NextResponse } from "next/server";
import { books } from "@/lib/mock-data";

// GET /api/v1/books/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(book);
}
