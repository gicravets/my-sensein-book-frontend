import type { Book } from "@/lib/types";

// Deterministic gradient cover from a seed, until the backend serves real covers.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const PALETTE = [
  ["#7c3aed", "#2563eb"],
  ["#db2777", "#7c3aed"],
  ["#059669", "#0891b2"],
  ["#d97706", "#dc2626"],
  ["#4f46e5", "#0ea5e9"],
  ["#9333ea", "#c026d3"],
];

export function Cover({ book, className = "" }: { book: Book; className?: string }) {
  if (book.coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={book.coverUrl} alt={book.title} className={`object-cover ${className}`} />;
  }
  const h = hash(book.coverSeed || book.title);
  const [a, b] = PALETTE[h % PALETTE.length];
  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${className}`}
      style={{ background: `linear-gradient(145deg, ${a}, ${b})` }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative p-2.5">
        <div className="text-[13px] font-semibold leading-tight text-white line-clamp-3 drop-shadow">
          {book.title}
        </div>
        <div className="mt-1 text-[10px] text-white/80 line-clamp-1">{book.authors[0]}</div>
      </div>
      <span className="absolute right-1.5 top-1.5 rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-medium text-white/90">
        {book.format}
      </span>
    </div>
  );
}
