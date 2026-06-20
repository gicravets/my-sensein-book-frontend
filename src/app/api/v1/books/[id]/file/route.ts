import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cwaEnabled, cwaBookFile } from "@/lib/cwa";

// GET /api/v1/books/:id/file — streams the book file.
// CWA mode: proxy /download/:id/epub. Mock mode: bundled sample EPUB.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (cwaEnabled()) {
    const f = await cwaBookFile(id);
    if (!f) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return new NextResponse(f.body, {
      headers: { "Content-Type": f.type, "Cache-Control": "no-store" },
    });
  }

  const file = path.join(process.cwd(), "data", "sample.epub");
  const buf = await readFile(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": "application/epub+zip", "Cache-Control": "no-store" },
  });
}
