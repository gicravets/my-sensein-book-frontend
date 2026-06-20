import Link from "next/link";
import type { Book } from "@/lib/types";
import { Cover } from "./Cover";
import { ProgressBar } from "./ProgressBar";

export function BookCard({ book }: { book: Book }) {
  const rp = book.readProgress;
  return (
    <Link href={`/book/${book.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-border transition-transform group-hover:-translate-y-1 group-hover:ring-accent/50">
        <Cover book={book} className="h-full w-full" />
        {rp?.completed && (
          <span className="absolute left-1.5 top-1.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            Прочитана
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{book.title}</div>
        <div className="truncate text-xs text-text-dim">{book.authors.join(", ")}</div>
        {rp && !rp.completed && (
          <div className="mt-1.5">
            <ProgressBar value={rp.totalProgression} />
          </div>
        )}
      </div>
    </Link>
  );
}
