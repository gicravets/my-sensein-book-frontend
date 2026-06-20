import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// GET /api/v1/books/:id/file — streams the book file.
// Mock: every book maps to the bundled sample EPUB. The Go backend will return
// the real per-book file from object storage.
export async function GET() {
  const file = path.join(process.cwd(), "data", "sample.epub");
  const buf = await readFile(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/epub+zip",
      "Cache-Control": "no-store",
    },
  });
}
