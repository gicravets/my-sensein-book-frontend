import { NextResponse } from "next/server";
import { books as mockBooks } from "@/lib/mock-data";

// GET /api/v1/series — multi-volume groupings from mock book metadata.
export async function GET() {
  const map = new Map<string, number>();
  for (const b of mockBooks) {
    const s = b.series;
    if (s) map.set(s, (map.get(s) ?? 0) + 1);
  }
  const content = [...map.entries()]
    .map(([name, bookCount]) => ({ name, bookCount }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ content, totalElements: content.length });
}
