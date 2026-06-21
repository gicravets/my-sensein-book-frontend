"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Shelf, Book } from "@/lib/types";
import { Cover } from "@/components/Cover";
import { Icon } from "@/components/cwa/Icon";

type ShelfWithBooks = Shelf & { books: Book[] };

// Shelves — mirrors the iOS app's "Полки": fanned cover stacks, name + count,
// "Новая полка" button, tap to open, delete.
export default function ShelvesPage() {
  const router = useRouter();
  const [shelves, setShelves] = useState<ShelfWithBooks[] | null>(null);

  const load = useCallback(async () => {
    const r = await api.shelves().catch(() => ({ content: [] as Shelf[] }));
    const withBooks = await Promise.all(
      r.content.map(async (s) => {
        let books: Book[] = [];
        try { books = (await api.books({ shelf: s.id, size: 3 })).content; } catch {}
        return { ...s, books };
      }),
    );
    setShelves(withBooks);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createShelf = async () => {
    const name = window.prompt("Название полки");
    if (name?.trim()) { await api.createShelf(name.trim()).catch(() => {}); load(); }
  };
  const removeShelf = async (s: Shelf) => {
    if (window.confirm(`Удалить полку «${s.name}»?`)) { await api.deleteShelf(s.id).catch(() => {}); load(); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-5">
      <div className="mb-5 flex items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold tracking-tight">Полки</h1>
        <button onClick={createShelf} className="flex items-center gap-1.5 rounded-full bg-cb-accent/15 px-4 py-2 text-sm font-semibold text-cb-accent transition-colors hover:bg-cb-accent/25">
          <Icon name="plus" size={16} /> Новая полка
        </button>
      </div>

      {shelves === null ? (
        <p className="text-text-dim">Загрузка…</p>
      ) : shelves.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-16 text-center text-text-dim">
          <Icon name="bookmark" size={32} />
          <p className="font-medium">Полок пока нет</p>
          <p className="text-sm">Создайте полку или добавьте книгу на полку из карточки книги.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shelves.map((s) => (
            <div key={s.id} className="group relative">
              <button
                onClick={() => router.push(`/?shelf=${s.id}`)}
                className="flex w-full flex-col items-stretch rounded-2xl border border-border bg-bg-elev p-3 text-left transition-colors hover:border-cb-accent"
              >
                {/* fanned cover stack (like the iOS ShelfCard) */}
                <div className="flex h-32 items-center justify-center rounded-xl bg-bg-elev2">
                  {s.books.length === 0 ? (
                    <span className="text-text-dim"><Icon name="bookmark" size={34} /></span>
                  ) : (
                    <div className="flex items-center">
                      {s.books.slice(0, 3).map((b, i) => (
                        <div
                          key={b.id}
                          className="h-[78px] w-[54px] shrink-0 overflow-hidden rounded-sm ring-1 ring-black/30"
                          style={{ marginLeft: i ? -20 : 0, transform: `rotate(${(i - 1) * 5}deg)`, zIndex: 3 - i, boxShadow: "0 2px 6px rgba(0,0,0,.35)" }}
                        >
                          <Cover book={b} className="h-full w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="truncate font-medium">{s.name}</span>
                  {s.kind === "smart" && <span className="rounded bg-cb-accent/20 px-1.5 py-0.5 text-[10px] text-cb-accent">умная</span>}
                </div>
                <p className="mt-0.5 text-xs text-text-dim">{s.bookCount} кн. · {s.isPublic ? "публичная" : "личная"}</p>
              </button>
              {s.kind !== "smart" && (
                <button
                  onClick={() => removeShelf(s)}
                  title="Удалить полку"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-red-500/80 group-hover:opacity-100"
                >
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
