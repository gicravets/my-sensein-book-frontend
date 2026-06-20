import { NextRequest, NextResponse } from "next/server";
import { cwaCover } from "@/lib/cwa";

// GET /api/cwa/cover/:id — proxies a CWA book cover (keeps the CWA session server-side).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await cwaCover(id);
  if (!c) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return new NextResponse(c.body, {
    headers: { "Content-Type": c.type, "Cache-Control": "public, max-age=3600" },
  });
}
