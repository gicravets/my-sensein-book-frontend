import { NextRequest, NextResponse } from "next/server";
import { bookmarks } from "@/lib/mock-data";
import type { Bookmark } from "@/lib/types";

// GET /api/v1/bookmarks?bookId=
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get("bookId");
  const list = bookId ? bookmarks.filter((b) => b.bookId === bookId) : bookmarks;
  return NextResponse.json({ content: list, totalElements: list.length });
}

// POST /api/v1/bookmarks
export async function POST(req: NextRequest) {
  const body = await req.json();
  const bm: Bookmark = {
    id: `bm-${Date.now()}`,
    bookId: body.bookId,
    locator: body.locator ?? { href: null, type: null, value: null, progression: 0 },
    label: body.label ?? "Закладка",
    createdAt: new Date().toISOString(),
  };
  bookmarks.unshift(bm);
  return NextResponse.json(bm, { status: 201 });
}
