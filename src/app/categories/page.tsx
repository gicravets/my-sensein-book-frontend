"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// Categories facet (CWA "Categories" = tags): aggregate tags + counts,
// each links to the library filtered by that tag.
export default function CategoriesPage() {
  const [tags, setTags] = useState<{ name: string; count: number }[] | null>(null);

  useEffect(() => {
    api.books({ size: 1000 }).then((r) => {
      const counts = new Map<string, number>();
      for (const b of r.content) for (const t of b.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
      setTags([...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => setTags([]));
  }, []);

  return (
    <div className="px-6 py-4">
      <h1 className="mb-4 text-[15px] font-normal text-cb-text/90">Categories ({tags?.length ?? 0})</h1>
      {tags === null ? (
        <p className="text-cb-muted">Загрузка…</p>
      ) : tags.length === 0 ? (
        <p className="text-cb-muted">Категорий нет</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.name}
              href={`/?tag=${encodeURIComponent(t.name)}`}
              className="flex items-center gap-2 rounded-[40px] border border-cb-border bg-cb-panel px-4 py-2 text-sm text-cb-text/90 hover:border-cb-accent hover:text-white"
            >
              {t.name}
              <span className="rounded-full bg-cb-bg2 px-2 text-xs text-cb-muted">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
