"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Book, Bookmark } from "@/lib/types";

export default function BookmarksPage() {
  const [items, setItems] = useState<Bookmark[] | null>(null);
  const [byBook, setByBook] = useState<Record<string, Book>>({});

  useEffect(() => {
    api.bookmarks().then((r) => setItems(r.content));
    api.books({ size: 500 }).then((r) =>
      setByBook(Object.fromEntries(r.content.map((b) => [b.id, b]))),
    );
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Закладки</h1>
      {items === null ? (
        <p className="text-text-dim">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-text-dim">Пока нет закладок</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((b) => {
            const book = byBook[b.bookId];
            return (
              <li key={b.id}>
                <Link
                  href={`/book/${b.bookId}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-elev px-4 py-3 transition-colors hover:border-accent"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{b.label}</div>
                    {book && (
                      <div className="truncate text-xs text-text-dim">{book.title}</div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-text-dim">
                    {Math.round(b.locator.progression * 100)}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
