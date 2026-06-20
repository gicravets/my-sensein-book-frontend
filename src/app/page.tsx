"use client";

import { useEffect, useState } from "react";
import { api, type BookQuery } from "@/lib/api";
import type { Book, Shelf } from "@/lib/types";
import { BookCard } from "@/components/BookCard";

const SORTS: { value: NonNullable<BookQuery["sort"]>; label: string }[] = [
  { value: "recent", label: "Недавние" },
  { value: "title", label: "Название" },
  { value: "author", label: "Автор" },
  { value: "progress", label: "Прогресс" },
];

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BookQuery["sort"]>("recent");
  const [shelf, setShelf] = useState<string | undefined>();

  useEffect(() => {
    api.shelves().then((r) => setShelves(r.content));
  }, []);

  useEffect(() => {
    setBooks(null);
    const t = setTimeout(() => {
      api.books({ search, sort, shelf }).then((r) => setBooks(r.content));
    }, 150);
    return () => clearTimeout(t);
  }, [search, sort, shelf]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold tracking-tight">Библиотека</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или автору…"
          className="w-56 rounded-lg border border-border bg-bg-elev px-3 py-2 text-sm outline-none placeholder:text-text-dim focus:border-accent"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as BookQuery["sort"])}
          className="rounded-lg border border-border bg-bg-elev px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={!shelf} onClick={() => setShelf(undefined)}>Все</Chip>
        {shelves.map((s) => (
          <Chip key={s.id} active={shelf === s.id} onClick={() => setShelf(s.id)}>
            {s.name} <span className="text-text-dim">· {s.bookCount}</span>
          </Chip>
        ))}
      </div>

      {books === null ? (
        <Grid>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</Grid>
      ) : books.length === 0 ? (
        <p className="py-20 text-center text-text-dim">Ничего не найдено</p>
      ) : (
        <Grid>{books.map((b) => <BookCard key={b.id} book={b} />)}</Grid>
      )}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {children}
    </div>
  );
}

function Skeleton() {
  return <div className="aspect-[2/3] animate-pulse rounded-lg bg-bg-elev" />;
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-accent bg-accent/15 text-text"
          : "border-border bg-bg-elev text-text-dim hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
