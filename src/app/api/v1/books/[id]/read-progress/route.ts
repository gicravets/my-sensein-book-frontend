import { NextRequest, NextResponse } from "next/server";
import { books } from "@/lib/mock-data";

// PATCH /api/v1/books/:id/read-progress  { completed: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((b) => b.id === id);
  if (!book) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  const body = await req.json();
  const completed = Boolean(body.completed);
  const prev = book.readProgress;
  book.readProgress = {
    progression: completed ? 1 : prev?.progression ?? 0,
    totalProgression: completed ? 1 : prev?.totalProgression ?? 0,
    page: prev?.page ?? 0,
    totalPages: prev?.totalPages ?? 0,
    completed,
    lastReadAt: new Date().toISOString(),
    deviceName: prev?.deviceName ?? "Web PWA",
  };
  return NextResponse.json(book.readProgress);
}
