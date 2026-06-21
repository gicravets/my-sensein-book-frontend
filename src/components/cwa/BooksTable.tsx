import Link from "next/link";
import type { Book } from "@/lib/types";
import { Cover } from "@/components/Cover";

// CWA "Books List" — table/DataTables-style view of the library.
export function BooksTable({ books }: { books: Book[] }) {
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-cb-border">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="bg-cb-panel text-left text-xs uppercase tracking-wide text-cb-muted">
            <th className="px-3 py-2 font-medium">Обложка</th>
            <th className="px-3 py-2 font-medium">Название</th>
            <th className="px-3 py-2 font-medium">Автор</th>
            <th className="px-3 py-2 font-medium">Серия</th>
            <th className="px-3 py-2 font-medium">Рейтинг</th>
            <th className="px-3 py-2 font-medium">Формат</th>
            <th className="px-3 py-2 font-medium">Добавлена</th>
            <th className="px-3 py-2 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id} className="border-t border-cb-border/60 transition-colors hover:bg-white/5">
              <td className="px-3 py-2">
                <Link href={`/book/${b.id}`} className="block h-12 w-8 overflow-hidden rounded-sm ring-1 ring-black/30">
                  <Cover book={b} className="h-full w-full" />
                </Link>
              </td>
              <td className="px-3 py-2">
                <Link href={`/book/${b.id}`} className="text-cb-text hover:text-cb-accent">{b.title}</Link>
              </td>
              <td className="px-3 py-2 text-cb-text/85">{b.authors.join(", ")}</td>
              <td className="px-3 py-2 text-cb-muted">{b.series ?? "—"}</td>
              <td className="px-3 py-2 text-cb-gold">{b.rating ? "★".repeat(b.rating) : "—"}</td>
              <td className="px-3 py-2 text-cb-muted">{b.format}</td>
              <td className="px-3 py-2 text-cb-muted">{new Date(b.addedAt).toLocaleDateString("ru")}</td>
              <td className="px-3 py-2">
                {b.readProgress?.completed ? (
                  <span className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-[11px] text-white">Прочитана</span>
                ) : b.readProgress ? (
                  <span className="text-cb-muted">{Math.round(b.readProgress.totalProgression * 100)}%</span>
                ) : (
                  <span className="text-cb-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
