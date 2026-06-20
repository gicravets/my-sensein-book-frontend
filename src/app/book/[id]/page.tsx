"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Book, Bookmark, Highlight } from "@/lib/types";
import { Cover } from "@/components/Cover";
import { ProgressBar } from "@/components/ProgressBar";
import { HighlightCard } from "@/components/HighlightCard";

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    api.book(id).then(setBook).catch(() => setNotFound(true));
    api.highlights(id).then((r) => setHighlights(r.content));
    api.bookmarks(id).then((r) => setBookmarks(r.content));
  }, [id]);

  if (notFound) return <Centered>Книга не найдена</Centered>;
  if (!book) return <Centered>Загрузка…</Centered>;

  const rp = book.readProgress;
  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <Link href="/" className="mb-5 inline-block text-sm text-text-dim hover:text-text">
        ← Библиотека
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0">
          <div className="aspect-[2/3] overflow-hidden rounded-xl ring-1 ring-border">
            <Cover book={book} className="h-full w-full" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="mt-1 text-text-dim">{book.authors.join(", ")}</p>
          {book.series && (
            <p className="mt-1 text-sm text-text-dim">
              Серия: {book.series} #{book.seriesIndex}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/book/${book.id}/read`}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-2"
            >
              {rp && rp.totalProgression > 0 ? "Продолжить чтение" : "Читать"}
            </Link>
            <button
              onClick={async () => {
                const next = !rp?.completed;
                const updated = await api.markRead(book.id, next);
                setBook({ ...book, readProgress: updated });
              }}
              className="rounded-lg border border-border bg-bg-elev px-4 py-2 text-sm hover:border-accent"
            >
              {rp?.completed ? "✓ Прочитана" : "Отметить прочитанной"}
            </button>
          </div>

          {rp && (
            <div className="mt-4 max-w-sm">
              <div className="mb-1 flex justify-between text-xs text-text-dim">
                <span>{Math.round(rp.totalProgression * 100)}%</span>
                <span>стр. {rp.page} / {rp.totalPages}</span>
              </div>
              <ProgressBar value={rp.totalProgression} />
              {rp.lastReadAt && (
                <p className="mt-1 text-[11px] text-text-dim">
                  Последнее чтение: {new Date(rp.lastReadAt).toLocaleString("ru")} · {rp.deviceName}
                </p>
              )}
            </div>
          )}

          {book.description && (
            <p className="mt-4 text-sm leading-relaxed text-text/90">{book.description}</p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
            <Meta k="Формат" v={book.format} />
            <Meta k="Язык" v={book.language ?? "—"} />
            <Meta k="Размер" v={`${(book.size / 1_048_576).toFixed(1)} МБ`} />
            {book.publisher && <Meta k="Издатель" v={book.publisher} />}
            {book.isbn && <Meta k="ISBN" v={book.isbn} />}
            <Meta k="Добавлена" v={new Date(book.addedAt).toLocaleDateString("ru")} />
          </dl>

          {book.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {book.tags.map((t) => (
                <span key={t} className="rounded-full bg-bg-elev2 px-2.5 py-1 text-xs text-text-dim">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Section title={`Закладки (${bookmarks.length})`}>
        {bookmarks.length === 0 ? (
          <Empty>Закладок нет</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {bookmarks.map((b) => (
              <li key={b.id} className="rounded-lg border border-border bg-bg-elev px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{b.label}</span>
                  <span className="shrink-0 text-xs text-text-dim">
                    {Math.round(b.locator.progression * 100)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Выделения и заметки (${highlights.length})`}>
        {highlights.length === 0 ? (
          <Empty>Выделений нет</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {highlights.map((h) => <HighlightCard key={h.id} h={h} />)}
          </div>
        )}
      </Section>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-text-dim">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-text-dim">{children}</p>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid h-[60vh] place-items-center text-text-dim">{children}</div>;
}
