"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, type BookQuery } from "@/lib/api";
import type { Book } from "@/lib/types";
import { BookCard } from "@/components/cwa/BookCard";
import { SortToolbar } from "@/components/cwa/SortToolbar";

function Library() {
  const sp = useSearchParams();
  const search = sp.get("search") ?? "";
  const shelf = sp.get("shelf") ?? undefined;
  const sort = (sp.get("sort") ?? "recent") as BookQuery["sort"];
  const filter = sp.get("filter"); // read | unread

  const [books, setBooks] = useState<Book[] | null>(null);

  useEffect(() => {
    setBooks(null);
    api.books({ search, sort, shelf })
      .then((r) => {
        let list = r.content;
        if (filter === "read") list = list.filter((b) => b.readProgress?.completed);
        if (filter === "unread") list = list.filter((b) => !b.readProgress?.completed);
        setBooks(list);
      })
      .catch((e) => console.error("[lib] books fetch failed:", e));
  }, [search, sort, shelf, filter]);

  const heading = search
    ? `${books?.length ?? 0} Results for: ${search}`
    : `Books (${books?.length ?? 0})`;

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
  return (
    <Suspense fallback={<div className="px-6 py-4 text-cb-muted">Загрузка…</div>}>
      <Library />
    </Suspense>
  );
}
