import { NextRequest, NextResponse } from "next/server";
import { books as mockBooks } from "@/lib/mock-data";
import { smartShelves } from "@/lib/mock-smart-shelves";
import type { Book, Page } from "@/lib/types";

// GET /api/v1/smart-shelves/:id/books — evaluate the shelf's rules into a page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sh = smartShelves.find((s) => s.id === id);
  if (!sh) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? 0);
  const size = Number(sp.get("size") ?? 50);

  let list: Book[] = [...mockBooks];
  const search = (sh.rules.search ?? "").trim().toLowerCase();
  if (search) {
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(search) ||
        b.authors.some((a) => a.toLowerCase().includes(search)),
    );
  }
  switch (sh.rules.filter) {
    case "unread":
      list = list.filter((b) => !b.readProgress?.completed);
      break;
    case "read":
      list = list.filter((b) => b.readProgress?.completed === true);
      break;
    case "rated":
      list = list.filter((b) => (b.rating ?? 0) > 0);
      break;
    case "archived":
      list = list.filter((b) => b.archived === true);
      break;
  }

  const content = list.slice(page * size, page * size + size);
  const body: Page<Book> = { content, totalElements: list.length, page, size };
  return NextResponse.json(body);
}
