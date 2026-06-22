import { NextRequest, NextResponse } from "next/server";
import { books as mockBooks, highlights as mockHighlights } from "@/lib/mock-data";

// GET /api/v1/search?q= — mock full-text over book metadata + saved quotes (ё/е folded).
const fold = (s: string) => s.replace(/ё/g, "е").replace(/Ё/g, "е").toLowerCase();

export async function GET(req: NextRequest) {
  const q = fold((req.nextUrl.searchParams.get("q") ?? "").trim());
  if (!q) return NextResponse.json({ books: [], highlights: [] });
  const terms = q.split(/\s+/).filter(Boolean);
  const matchAll = (hay: string) => {
    const h = fold(hay);
    return terms.every((t) => h.includes(t));
  };

  const books = mockBooks.filter((b) =>
    matchAll(`${b.title} ${b.authors.join(" ")} ${b.description ?? ""} ${(b.tags ?? []).join(" ")}`),
  );
  const titleOf = (id: string) => mockBooks.find((b) => b.id === id)?.title ?? "";
  const highlights = mockHighlights
    .filter((h) => matchAll(`${h.text} ${h.note ?? ""}`))
    .map((h) => ({ id: h.id, bookId: h.bookId, bookTitle: titleOf(h.bookId), text: h.text, note: h.note ?? "" }));

  return NextResponse.json({ books, highlights });
}
