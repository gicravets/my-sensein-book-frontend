"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Advanced Search — multi-field form that builds a library query.
export default function AdvancedSearchPage() {
  const router = useRouter();
  const [f, setF] = useState({ search: "", author: "", series: "", tag: "", language: "", format: "", filter: "" });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v.trim()) sp.set(k, v.trim()); });
    router.push(`/?${sp.toString()}`);
  };

  const field = "h-9 w-full rounded border border-cb-border bg-cb-panel px-3 text-sm text-cb-text outline-none transition-colors focus:border-cb-accent";
  const label = "mb-1 block text-xs uppercase tracking-wide text-cb-gold";

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h1 className="mb-5 text-lg font-semibold">Advanced Search</h1>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Название / автор содержит</label>
          <input className={field} value={f.search} onChange={set("search")} placeholder="Поиск по тексту…" />
        </div>
        <div><label className={label}>Автор</label><input className={field} value={f.author} onChange={set("author")} /></div>
        <div><label className={label}>Серия</label><input className={field} value={f.series} onChange={set("series")} /></div>
        <div><label className={label}>Тег</label><input className={field} value={f.tag} onChange={set("tag")} /></div>
        <div><label className={label}>Язык</label><input className={field} value={f.language} onChange={set("language")} placeholder="ru / en" /></div>
        <div>
          <label className={label}>Формат</label>
          <select className={field} value={f.format} onChange={set("format")}>
            <option value="">любой</option><option value="EPUB">EPUB</option><option value="FB2">FB2</option><option value="PDF">PDF</option>
          </select>
        </div>
        <div>
          <label className={label}>Статус</label>
          <select className={field} value={f.filter} onChange={set("filter")}>
            <option value="">любой</option><option value="read">прочитанные</option><option value="unread">непрочитанные</option>
            <option value="rated">с рейтингом</option><option value="archived">архив</option>
          </select>
        </div>
        <div className="sm:col-span-2 mt-2 flex gap-2">
          <button type="submit" className="rounded-[40px] bg-cb-accent px-7 py-2 text-sm font-semibold uppercase text-white transition-colors hover:bg-cb-accent-hover">Искать</button>
          <button type="button" onClick={() => setF({ search: "", author: "", series: "", tag: "", language: "", format: "", filter: "" })} className="rounded-[40px] border border-cb-border px-5 py-2 text-sm text-cb-text/80 transition-colors hover:text-white">Сброс</button>
        </div>
      </form>
    </div>
  );
}
