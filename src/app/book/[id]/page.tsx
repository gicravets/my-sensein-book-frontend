"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Book, Bookmark, Highlight, Shelf } from "@/lib/types";
import { Cover } from "@/components/Cover";
import { HighlightCard } from "@/components/HighlightCard";
import { Icon } from "@/components/cwa/Icon";

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [showShelf, setShowShelf] = useState(false);

  useEffect(() => {
    api.book(id).then(setBook).catch(() => setNotFound(true));
    api.highlights(id).then((r) => setHighlights(r.content)).catch(() => {});
    api.bookmarks(id).then((r) => setBookmarks(r.content)).catch(() => {});
    api.shelves().then((r) => setShelves(r.content)).catch(() => {});
  }, [id]);

  const toggleShelf = async (shelfId: string, on: boolean) => {
    if (!book) return;
    const updated = on
      ? await api.addToShelf(shelfId, book.id)
      : await api.removeFromShelf(shelfId, book.id);
    if (updated) setBook(updated);
  };

  const rate = async (n: number) => {
    if (!book) return;
    const updated = await api.setRating(book.id, n === book.rating ? 0 : n);
    if (updated) setBook(updated);
  };

  const toggleArchive = async () => {
    if (!book) return;
    const updated = await api.setArchived(book.id, !book.archived);
    if (updated) setBook(updated);
  };

  const [enriching, setEnriching] = useState(false);
  const enrich = async () => {
    if (!book) return;
    setEnriching(true);
    try {
      const r = await api.enrichBook(book.id);
      if (r?.book) setBook(r.book);
    } catch { /* ignore */ }
    setEnriching(false);
  };

  if (notFound) return <Centered>Книга не найдена</Centered>;
  if (!book) return <Centered>Загрузка…</Centered>;

  const rp = book.readProgress;
  const sizeMb = book.size ? `${(book.size / 1_048_576).toFixed(0)} MiB` : "—";

  const toggleRead = async () => {
    const updated = await api.markRead(book.id, !rp?.completed);
    setBook({ ...book, readProgress: updated });
  };

  return (
    <div className="px-6 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row">
        {/* cover */}
        <div className="w-full max-w-[280px] shrink-0">
          <div className="aspect-[2/3] overflow-hidden rounded-sm shadow-lg ring-1 ring-black/40">
            <Cover book={book} className="h-full w-full" />
          </div>
        </div>

        {/* details */}
        <div className="min-w-0 flex-1">
          {/* action icon row */}
          <div className="mb-5 flex items-center gap-1">
            <a href={api.bookFileUrl(book.id)} download>
              <ActionIcon name="download" title="Скачать" />
            </a>
            <Link href={`/book/${book.id}/read`}><ActionIcon name="book" title="Читать" /></Link>
            <button onClick={toggleRead}>
              <ActionIcon name={rp?.completed ? "eye" : "eyeSlash"} title={rp?.completed ? "Прочитана" : "Отметить прочитанной"} active={rp?.completed} />
            </button>
            <div className="relative">
              <button onClick={() => setShowShelf((v) => !v)}>
                <ActionIcon name="folder" title="На полку" active={showShelf} />
              </button>
              {showShelf && (
                <div className="absolute left-0 top-11 z-20 w-60 rounded-lg border border-cb-border bg-cb-panel p-2 shadow-xl">
                  <div className="px-2 pb-1 text-xs uppercase text-cb-muted">Полки</div>
                  {shelves.length === 0 && <div className="px-2 py-1 text-sm text-cb-muted">Нет полок</div>}
                  {shelves.map((s) => {
                    const on = book.shelfIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleShelf(s.id, !on)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-white/5"
                      >
                        <span className={`grid h-4 w-4 place-items-center rounded-sm border ${on ? "border-cb-accent bg-cb-accent text-white" : "border-cb-border"}`}>
                          {on ? "✓" : ""}
                        </span>
                        <span className="truncate">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <ActionIcon name="pencil" title="Редактировать" />
            <button onClick={enrich} disabled={enriching}>
              <ActionIcon name="download" title={enriching ? "Загрузка…" : "Обновить обложку и описание"} />
            </button>
            <button onClick={toggleArchive}>
              <ActionIcon name="archive" title={book.archived ? "Разархивировать" : "В архив"} active={book.archived} />
            </button>
            <ActionIcon name="trash" title="Удалить" />
          </div>

          <h1 className="text-[2rem] font-bold leading-tight text-cb-text">{book.title}</h1>
          <p className="mt-1 text-cb-muted">{book.authors.join(", ")}</p>

          {/* rating (interactive) */}
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => rate(i + 1)} title={`${i + 1} / 5`} className="transition-transform hover:scale-110">
                <Icon name="star" size={18} className={i < book.rating ? "text-cb-gold" : "text-cb-muted hover:text-cb-gold"} />
              </button>
            ))}
          </div>

          {/* read / continue */}
          <div className="mt-4">
            <Link
              href={`/book/${book.id}/read`}
              className="inline-block rounded-[40px] bg-cb-accent px-7 py-2 text-sm font-semibold uppercase text-white hover:bg-cb-accent-hover"
            >
              {rp && rp.totalProgression > 0 ? "Продолжить" : "Читать"}
            </Link>
            {rp && rp.totalProgression > 0 && (
              <span className="ml-3 text-sm text-cb-muted">{Math.round(rp.totalProgression * 100)}%</span>
            )}
          </div>

          {/* meta pill cards */}
          <div className="mt-5 flex flex-wrap gap-2">
            <MetaCard label="ID" value={book.id} />
            <MetaCard label="Добавлена" value={new Date(book.addedAt).toLocaleDateString("ru")} />
            <MetaCard label="Формат" value={`${book.format} (${sizeMb})`} />
            {book.language && <MetaCard label="Язык" value={book.language} />}
            {book.publisher && <MetaCard label="Издатель" value={book.publisher} />}
            {book.isbn && <MetaCard label="ISBN" value={book.isbn} />}
            {rp?.deviceName && <MetaCard label="Устройство" value={rp.deviceName} />}
          </div>

          {/* tags */}
          {book.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-cb-muted"><Icon name="tag" size={16} /></span>
              {book.tags.map((t) => (
                <span key={t} className="rounded-[40px] bg-cb-panel px-3 py-1 text-xs text-cb-text/90 ring-1 ring-cb-border">{t}</span>
              ))}
            </div>
          )}

          {book.description && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cb-text/85">{book.description}</p>
          )}
        </div>
      </div>

      {/* bookmarks + highlights */}
      <div className="mx-auto mt-10 max-w-5xl">
        <Section title={`Закладки (${bookmarks.length})`}>
          {bookmarks.length === 0 ? <Empty>Закладок нет</Empty> : (
            <ul className="flex flex-col gap-2">
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded bg-cb-panel px-4 py-3 ring-1 ring-cb-border">
                  <span className="text-sm">{b.label}</span>
                  <span className="text-xs text-cb-muted">{Math.round(b.locator.progression * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title={`Выделения и заметки (${highlights.length})`}>
          {highlights.length === 0 ? <Empty>Выделений нет</Empty> : (
            <div className="flex flex-col gap-3">{highlights.map((h) => <HighlightCard key={h.id} h={h} />)}</div>
          )}
        </Section>
      </div>
    </div>
  );
}

function ActionIcon({ name, title, active }: { name: string; title: string; active?: boolean }) {
  return (
    <span
      title={title}
      className={`grid h-10 w-10 place-items-center rounded transition-colors ${
        active ? "text-cb-accent" : "text-cb-text/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon name={name} size={20} />
    </span>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[40px] bg-cb-panel px-4 py-2 ring-1 ring-cb-border">
      <span className="text-xs uppercase text-cb-muted">{label}</span>
      <span className="text-sm text-cb-text">{value}</span>
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
  return <p className="rounded border border-dashed border-cb-border px-4 py-6 text-center text-sm text-cb-muted">{children}</p>;
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid h-[60vh] place-items-center text-cb-muted">{children}</div>;
}
