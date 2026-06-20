import { NextRequest, NextResponse } from "next/server";
import { books } from "@/lib/mock-data";
import type { Book, Page } from "@/lib/types";

// GET /api/v1/books?search=&shelf=&sort=&page=&size=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const search = (sp.get("search") ?? "").trim().toLowerCase();
  const shelf = sp.get("shelf");
  const sort = sp.get("sort") ?? "recent";
  const page = Number(sp.get("page") ?? 0);
  const size = Number(sp.get("size") ?? 50);

  let list: Book[] = [...books];

  if (search) {
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(search) ||
        b.authors.some((a) => a.toLowerCase().includes(search)),
    );
  }
  if (shelf) list = list.filter((b) => b.shelfIds.includes(shelf));

  list.sort((a, b) => {
    switch (sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return (a.authors[0] ?? "").localeCompare(b.authors[0] ?? "");
      case "progress":
        return (b.readProgress?.totalProgression ?? -1) - (a.readProgress?.totalProgression ?? -1);
      case "recent":
      default:
        return (b.readProgress?.lastReadAt ?? b.addedAt).localeCompare(
          a.readProgress?.lastReadAt ?? a.addedAt,
        );
    }
  });

  const content = list.slice(page * size, page * size + size);
  const body: Page<Book> = { content, totalElements: list.length, page, size };
  return NextResponse.json(body);
}
