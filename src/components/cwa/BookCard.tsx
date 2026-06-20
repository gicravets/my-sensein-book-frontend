import Link from "next/link";
import type { Book } from "@/lib/types";
import { Cover } from "@/components/Cover";

// caliBlur book card: plain cover + title link + author below.
export function BookCard({ book }: { book: Book }) {
  return (
    <div className="flex flex-col">
      <Link href={`/book/${book.id}`} className="group block">
        <div className="aspect-[2/3] overflow-hidden rounded-sm bg-black/20 shadow-md ring-1 ring-black/30 transition group-hover:ring-cb-accent/60">
          <Cover book={book} className="h-full w-full" />
        </div>
      </Link>
      <Link
        href={`/book/${book.id}`}
        className="mt-2 line-clamp-2 text-[13px] leading-snug text-cb-text hover:text-cb-accent"
      >
        {book.title}
      </Link>
      <span className="line-clamp-1 text-[12px] text-cb-muted">{book.authors.join(", ")}</span>
    </div>
  );
}
