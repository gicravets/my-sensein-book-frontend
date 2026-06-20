"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Highlight, HighlightColor } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const COLORS: { key: HighlightColor; hex: string }[] = [
  { key: "yellow", hex: "#eab308" },
  { key: "green", hex: "#22c55e" },
  { key: "blue", hex: "#3b82f6" },
  { key: "pink", hex: "#ec4899" },
  { key: "orange", hex: "#f97316" },
];

interface TocItem { label: string; href: string }
interface SelInfo { cfi: string; text: string; x: number; y: number }

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const rendRef = useRef<any>(null);

  const [title, setTitle] = useState("");
  const [ready, setReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState(false);
  const [sel, setSel] = useState<SelInfo | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [author, setAuthor] = useState("");

  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(null), 1500); };

  // --- init epub.js ---
  useEffect(() => {
    let disposed = false;
    let existing: Highlight[] = [];

    (async () => {
     try {
      const ePub = (await import("epubjs")).default;
      api.book(id).then((b) => { setTitle(b.title); setAuthor(b.authors.join(", ")); }).catch(() => {});
      try { existing = (await api.highlights(id)).content; } catch {}

      if (disposed || !viewerRef.current) return;
      // Fetch as ArrayBuffer so epub.js opens it as an archive (a URL without a
      // .epub suffix would be misread as an unzipped directory → 404 on container.xml).
      const buf = await fetch(api.bookFileUrl(id)).then((r) => r.arrayBuffer());
      if (disposed || !viewerRef.current) return;
      const book = ePub(buf);
      bookRef.current = book;
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%", height: "100%", flow: "paginated", spread: "none",
        allowScriptedContent: true,
      });
      rendRef.current = rendition;

      // Light theme — matches CWA's epub reader (white page, dark text)
      rendition.themes.register("light", {
        "html, body": {
          background: "#ffffff !important",
          color: "#222 !important",
          "line-height": "1.6",
          padding: "0 8px",
        },
        "p, div, span, li, td, th, blockquote, h1, h2, h3, h4, h5, h6, em, strong, b, i":
          { color: "#222 !important" },
        p: { "font-size": "1.05rem" },
        a: { color: "#cc7b19 !important" },
      });
      rendition.themes.select("light");

      await rendition.display();
      book.loaded.navigation.then((nav: any) =>
        setToc(nav.toc.map((t: any) => ({ label: t.label.trim(), href: t.href }))),
      );

      setReady(true); // content is displayed; locations are only for % accuracy
      book.ready
        .then(() => book.locations.generate(1200))
        .catch((e: any) => console.error("[reader] locations", e));

      // re-apply saved highlights
      for (const h of existing) {
        if (h.locator.value) {
          const hex = COLORS.find((c) => c.key === h.color)?.hex ?? "#eab308";
          try {
            rendition.annotations.highlight(h.locator.value, {}, () => {}, "", {
              fill: hex, "fill-opacity": "0.35",
            });
          } catch {}
        }
      }

      let saveT: any;
      rendition.on("relocated", (loc: any) => {
        const p = loc?.start?.percentage ?? 0;
        setPercent(p);
        clearTimeout(saveT);
        saveT = setTimeout(() => {
          api.putProgression(id, {
            progression: p, totalProgression: p,
            page: Math.round(p * 100), totalPages: 100,
          }).catch(() => {});
        }, 600);
      });

      rendition.on("selected", (cfiRange: string, contents: any) => {
        const range = rendition.getRange(cfiRange);
        const text = range?.toString?.().trim() ?? "";
        if (!text) return;
        const rect = range.getBoundingClientRect();
        const frame = contents.document.defaultView.frameElement.getBoundingClientRect();
        setSel({ cfi: cfiRange, text, x: frame.left + rect.left + rect.width / 2, y: frame.top + rect.top });
      });

      rendition.on("keyup", (e: KeyboardEvent) => onKey(e));
     } catch (e: any) {
      console.error("[reader] init failed", e);
      setErr(String(e?.message ?? e));
     }
    })();

    return () => {
      disposed = true;
      try { bookRef.current?.destroy(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight") rendRef.current?.next();
    if (e.key === "ArrowLeft") rendRef.current?.prev();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keyup", h);
    return () => window.removeEventListener("keyup", h);
  }, [onKey]);

  // reflow the rendition when the viewport changes (resize / orientation)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      t = setTimeout(() => { try { (rendRef.current as any)?.resize(); } catch {} }, 200);
    };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);

  const addHighlight = async (color: HighlightColor) => {
    if (!sel) return;
    const hex = COLORS.find((c) => c.key === color)!.hex;
    try {
      rendRef.current.annotations.highlight(sel.cfi, {}, () => {}, "", {
        fill: hex, "fill-opacity": "0.35",
      });
    } catch {}
    await api.createHighlight({
      bookId: id, text: sel.text, color,
      locator: { href: null, type: "epubcfi", value: sel.cfi, progression: percent },
    }).catch(() => {});
    rendRef.current?.getContents?.().forEach?.((c: any) => c.window.getSelection().removeAllRanges());
    setSel(null);
    flash("Выделение сохранено");
  };

  const addBookmark = async () => {
    const loc = rendRef.current?.currentLocation?.();
    const cfi = loc?.start?.cfi ?? null;
    await api.createBookmark({
      bookId: id, label: `Закладка · ${Math.round(percent * 100)}%`,
      locator: { href: null, type: "epubcfi", value: cfi, progression: percent },
    }).catch(() => {});
    flash("Закладка добавлена");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-[#222]" onClick={() => sel && setSel(null)}>
      {/* top bar (CWA light reader) */}
      <header className="flex items-center gap-3 px-4 py-2.5">
        <IconBtn onClick={() => setShowToc((v) => !v)} title="Оглавление">☰</IconBtn>
        <div className="flex-1 truncate text-center text-sm text-[#555]">
          <span className="font-semibold text-[#333]">{title}</span>
          {author && <span className="text-[#999]"> — {author}</span>}
        </div>
        <IconBtn onClick={addBookmark} title="Закладка">🔖</IconBtn>
        <Link href={`/book/${id}`} title="К книге" className="grid h-8 w-8 place-items-center rounded text-[#777] hover:bg-black/5 hover:text-[#333]">✕</Link>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* TOC drawer (light) */}
        {showToc && (
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-black/10 bg-[#fafafa] p-3">
            <div className="mb-2 px-2 text-xs uppercase tracking-wide text-[#999]">Оглавление</div>
            <ul className="flex flex-col">
              {toc.map((t, i) => (
                <li key={i}>
                  <button
                    onClick={() => { rendRef.current?.display(t.href); setShowToc(false); }}
                    className="w-full truncate rounded px-2 py-1.5 text-left text-sm text-[#555] hover:bg-black/5 hover:text-[#111]"
                  >
                    {t.label || "—"}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* viewer + chevron nav (CWA style) */}
        <div className="relative flex-1">
          <div ref={viewerRef} className="h-full w-full" />
          {!ready && !err && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-[#999]">
              Загрузка книги…
            </div>
          )}
          {err && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-500">
              Ошибка чтения: {err}
            </div>
          )}
          <button
            aria-label="prev"
            onClick={() => rendRef.current?.prev()}
            className="absolute left-0 top-0 grid h-full w-14 place-items-center text-3xl text-black/20 hover:text-black/40"
          >‹</button>
          <button
            aria-label="next"
            onClick={() => rendRef.current?.next()}
            className="absolute right-0 top-0 grid h-full w-14 place-items-center text-3xl text-black/20 hover:text-black/40"
          >›</button>
          {/* progress % bottom-right */}
          <div className="pointer-events-none absolute bottom-3 right-5 text-sm font-medium text-[#333]">
            {Math.round(percent * 100)}%
          </div>
        </div>
      </div>

      {/* selection popup */}
      {sel && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-bg-elev2 p-2 shadow-xl"
          style={{ left: sel.x, top: sel.y - 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => addHighlight(c.key)}
                className="h-6 w-6 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: c.hex }}
                title={`Выделить (${c.key})`}
              />
            ))}
          </div>
        </div>
      )}

      {/* toast */}
      {saved && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-bg-elev2 px-4 py-2 text-sm shadow-lg">
          {saved}
        </div>
      )}
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-8 w-8 place-items-center rounded text-sm text-[#777] hover:bg-black/5 hover:text-[#333]"
    >
      {children}
    </button>
  );
}
