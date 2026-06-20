import { NextRequest, NextResponse } from "next/server";
import { highlights } from "@/lib/mock-data";
import type { Highlight } from "@/lib/types";

// GET /api/v1/highlights?bookId=
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get("bookId");
  const list = bookId ? highlights.filter((h) => h.bookId === bookId) : highlights;
  return NextResponse.json({ content: list, totalElements: list.length });
}

// POST /api/v1/highlights
export async function POST(req: NextRequest) {
  const body = await req.json();
  const h: Highlight = {
    id: `hl-${Date.now()}`,
    bookId: body.bookId,
    text: body.text ?? "",
    color: body.color ?? "yellow",
    note: body.note ?? null,
    locator: body.locator ?? { href: null, type: null, value: null, progression: 0 },
    createdAt: new Date().toISOString(),
  };
  highlights.unshift(h);
  return NextResponse.json(h, { status: 201 });
}
