"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Book } from "@/lib/types";

type FacetType = "authors" | "series" | "publishers" | "languages" | "formats" | "categories";

const FACETS: Record<FacetType, { title: string; param: string; values: (b: Book) => string[] }> = {
  authors: { title: "Authors", param: "author", values: (b) => b.authors },
  series: { title: "Series", param: "series", values: (b) => (b.series ? [b.series] : []) },
  publishers: { title: "Publishers", param: "publisher", values: (b) => (b.publisher ? [b.publisher] : []) },
  languages: { title: "Languages", param: "language", values: (b) => (b.language ? [b.language] : []) },
  formats: { title: "File formats", param: "format", values: (b) => [b.format] },
  categories: { title: "Categories", param: "tag", values: (b) => b.tags },
};

export default function BrowseFacetPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const facet = FACETS[type as FacetType];
  const [items, setItems] = useState<{ name: string; count: number }[] | null>(null);

  useEffect(() => {
    if (!facet) { setItems([]); return; }
    api.books({ size: 1000 }).then((r) => {
      const counts = new Map<string, number>();
      for (const b of r.content) for (const v of facet.values(b)) counts.set(v, (counts.get(v) ?? 0) + 1);
      setItems([...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => setItems([]));
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!facet) return <div className="px-6 py-4 text-cb-muted">Неизвестный раздел</div>;

  return (
    <div className="px-6 py-4">
      <h1 className="mb-4 text-[15px] font-normal text-cb-text/90">{facet.title} ({items?.length ?? 0})</h1>
      {items === null ? (
        <p className="text-cb-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-cb-muted">Пусто</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <Link
              key={it.name}
              href={`/?${facet.param}=${encodeURIComponent(it.name)}`}
              className="flex items-center gap-2 rounded-[40px] border border-cb-border bg-cb-panel px-4 py-2 text-sm text-cb-text/90 transition-colors hover:border-cb-accent hover:text-white"
            >
              {it.name}
              <span className="rounded-full bg-cb-bg2 px-2 text-xs text-cb-muted">{it.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
