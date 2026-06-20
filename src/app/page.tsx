"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, type BookQuery } from "@/lib/api";
import type { Book } from "@/lib/types";
import { BookCard } from "@/components/cwa/BookCard";
import { SortToolbar } from "@/components/cwa/SortToolbar";

function Library() {
  const sp = useSearchParams();
  const search = sp.get("search") ?? "";
  const shelf = sp.get("shelf") ?? undefined;
  const tag = sp.get("tag") ?? undefined;
  const author = sp.get("author") ?? undefined;
  const series = sp.get("series") ?? undefined;
  const sort = (sp.get("sort") ?? "recent") as BookQuery["sort"];
  const filter = sp.get("filter"); // read | unread

  const [books, setBooks] = useState<Book[] | null>(null);
  const [shelfName, setShelfName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBooks(null);
    api.books({ search, sort, shelf, tag, author, series })
      .then((r) => {
        if (cancelled) return;
        let list = r.content;
        if (filter === "read") list = list.filter((b) => b.readProgress?.completed);
        if (filter === "unread") list = list.filter((b) => !b.readProgress?.completed);
        setBooks(list);
      })
      .catch((e) => console.error("[lib] books fetch failed:", e));
    return () => { cancelled = true; };
  }, [search, sort, shelf, tag, author, series, filter]);

  useEffect(() => {
    if (!shelf) { setShelfName(null); return; }
    api.shelves().then((r) => setShelfName(r.content.find((s) => s.id === shelf)?.name ?? null)).catch(() => {});
  }, [shelf]);

  const count = books?.length ?? 0;
  const facet = tag ?? author ?? series;
  const heading = search
    ? `${count} Results for: ${search}`
    : facet
      ? `${facet} (${count})`
      : shelf
        ? `${shelfName ?? "Полка"} (${count})`
        : filter === "read"
          ? `Read Books (${count})`
          : filter === "unread"
            ? `Unread Books (${count})`
            : `Books (${count})`;

  return (
    <div className="px-6 py-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-[15px] font-normal text-cb-text/90">{heading}</h1>
        <SortToolbar />
      </div>

      {books === null ? (
        <Grid>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-sm bg-white/5" />
          ))}
        </Grid>
      ) : books.length === 0 ? (
        <p className="py-20 text-center text-cb-muted">Ничего не найдено</p>
      ) : (
        <Grid>{books.map((b) => <BookCard key={b.id} book={b} />)}</Grid>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-x-5 gap-y-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
      {children}
    </div>
  );
}

export default function Page() {
  return <Library />;
}
