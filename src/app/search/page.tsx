"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, type HighlightHit } from "@/lib/api";
import type { Book } from "@/lib/types";
import { BookCard } from "@/components/cwa/BookCard";

// Full-text search results: matching books + saved quotes (FTS5, ё/е folded).
export default function SearchPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") ?? "";
  const [books, setBooks] = useState<Book[]>([]);
  const [hits, setHits] = useState<HighlightHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api
      .search(q)
      .then((r) => { setBooks(r.books); setHits(r.highlights); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="px-4 py-5 sm:px-6">
      <h1 className="mb-4 text-base font-medium text-white/80">
        Поиск{q ? <>: <span className="text-white">«{q}»</span></> : null}
      </h1>

      {loading && <p className="text-sm text-white/40">Поиск…</p>}

      {!loading && q && books.length === 0 && hits.length === 0 && (
        <p className="text-sm text-white/40">Ничего не найдено.</p>
      )}

      {books.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/40">Книги · {books.length}</h2>
          <div className="grid grid-cols-3 gap-x-5 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
            {books.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      {hits.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs uppercase tracking-wide text-white/40">Цитаты · {hits.length}</h2>
          <ul className="space-y-2">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => router.push(`/book/${h.bookId}`)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
                >
                  <p className="text-sm text-white/85">{h.text}</p>
                  {h.note && <p className="mt-1 text-xs text-white/50">{h.note}</p>}
                  <p className="mt-1 text-xs text-[#B14EE0]">{h.bookTitle}</p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
