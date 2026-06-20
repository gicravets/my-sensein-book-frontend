"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Book, Highlight } from "@/lib/types";
import { HighlightCard } from "@/components/HighlightCard";

export default function HighlightsPage() {
  const [items, setItems] = useState<Highlight[] | null>(null);
  const [byBook, setByBook] = useState<Record<string, Book>>({});

  useEffect(() => {
    api.highlights().then((r) => setItems(r.content));
    api.books({ size: 500 }).then((r) =>
      setByBook(Object.fromEntries(r.content.map((b) => [b.id, b]))),
    );
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Выделения и заметки</h1>
      {items === null ? (
        <p className="text-text-dim">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-text-dim">Пока нет выделений</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((h) => {
            const book = byBook[h.bookId];
            return (
              <div key={h.id}>
                {book && (
                  <div className="mb-1.5 text-xs text-text-dim">
                    {book.title} · {book.authors[0]}
                  </div>
                )}
                <HighlightCard h={h} bookHref={`/book/${h.bookId}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
