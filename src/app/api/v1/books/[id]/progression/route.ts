import { NextRequest, NextResponse } from "next/server";
import { books } from "@/lib/mock-data";

// GET/PUT /api/v1/books/:id/progression — Readium-style reading position.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(book.readProgress);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const body = await req.json();
  const prev = book.readProgress;
  book.readProgress = {
    progression: body.progression ?? prev?.progression ?? 0,
    totalProgression: body.totalProgression ?? prev?.totalProgression ?? 0,
    page: body.page ?? prev?.page ?? 0,
    totalPages: body.totalPages ?? prev?.totalPages ?? 0,
    completed: body.completed ?? prev?.completed ?? false,
    lastReadAt: new Date().toISOString(),
    deviceName: body.deviceName ?? "Web PWA",
  };
  return NextResponse.json(book.readProgress);
}
