"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Shelf } from "@/lib/types";

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Shelf[] | null>(null);

  useEffect(() => {
    api.shelves().then((r) => setShelves(r.content));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Полки</h1>
      {shelves === null ? (
        <p className="text-text-dim">Загрузка…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {shelves.map((s) => (
            <Link
              key={s.id}
              href={`/?shelf=${s.id}`}
              className="group rounded-xl border border-border bg-bg-elev p-4 transition-colors hover:border-accent"
            >
              <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-accent/25 to-accent-2/25 text-3xl">
                {s.kind === "smart" ? "✨" : "🗂️"}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.name}</span>
                {s.kind === "smart" && (
                  <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                    умная
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-dim">
                {s.bookCount} книг · {s.isPublic ? "публичная" : "личная"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
