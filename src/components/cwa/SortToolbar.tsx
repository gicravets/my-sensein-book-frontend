"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

// 8-button sort toolbar (caliBlur parity). Titles verbatim from the VPT journal.
// Our API supports recent/title/author; reverse/pubdate variants are visual for
// now and fall back server-side (TODO: add reverse + pubdate to the backend).
const BUTTONS: { sort: string; glyph: string; dir: "↓" | "↑"; title: string }[] = [
  { sort: "recent", glyph: "▤", dir: "↓", title: "Sort according to book date, newest first" },
  { sort: "recent_old", glyph: "▤", dir: "↑", title: "Sort according to book date, oldest first" },
  { sort: "title", glyph: "A", dir: "↓", title: "Sort title in alphabetical order" },
  { sort: "title_desc", glyph: "A", dir: "↑", title: "Sort title in reverse alphabetical order" },
  { sort: "author", glyph: "✎", dir: "↓", title: "Sort authors in alphabetical order" },
  { sort: "author_desc", glyph: "✎", dir: "↑", title: "Sort authors in reverse alphabetical order" },
  { sort: "pub", glyph: "▦", dir: "↓", title: "Sort according to publishing date, newest first" },
  { sort: "pub_desc", glyph: "▦", dir: "↑", title: "Sort according to publishing date, oldest first" },
];

export function SortToolbar() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const active = sp.get("sort") ?? "recent";

  const go = (sort: string) => {
    const next = new URLSearchParams(sp.toString());
    if (sort === "recent") next.delete("sort");
    else next.set("sort", sort);
    router.push(`${path}?${next.toString()}`);
  };

  return (
    <div className="inline-flex overflow-hidden rounded bg-cb-panel/70 ring-1 ring-cb-border">
      {BUTTONS.map((b) => (
        <button
          key={b.sort}
          title={b.title}
          onClick={() => go(b.sort)}
          className={`flex h-9 w-11 items-center justify-center gap-0.5 border-r border-cb-border/60 text-sm last:border-r-0 transition-colors ${
            active === b.sort ? "bg-cb-accent text-white" : "text-cb-text/80 hover:bg-white/5"
          }`}
        >
          <span>{b.glyph}</span>
          <span className="text-[11px] opacity-80">{b.dir}</span>
        </button>
      ))}
    </div>
  );
}
