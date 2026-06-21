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

type ThemeKey = "light" | "sepia" | "dark";
const THEMES: Record<ThemeKey, { label: string; bg: string; fg: string; link: string }> = {
  light: { label: "Светлая", bg: "#ffffff", fg: "#222222", link: "#cc7b19" },
  sepia: { label: "Сепия", bg: "#f4ecd8", fg: "#5b4636", link: "#9a6a1f" },
  dark: { label: "Тёмная", bg: "#1b1b1d", fg: "#cfcfcf", link: "#e0a155" },
};

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

  // reading experience (page-curl + gestures + themes), persisted
  const [theme, setTheme] = useState<ThemeKey>("light");
  const [fontPct, setFontPct] = useState(100);
  const [chrome, setChrome] = useState(true);     // top/side controls visible
  const [settings, setSettings] = useState(false);
  const [flip, setFlip] = useState<"next" | "prev" | null>(null);
  const flipping = useRef(false);

  const flash = (m: string) => { setSaved(m); setTimeout(() => setSaved(null), 1500); };

  // page turn with a page-curl animation (mobile-reader feel)
  const turn = useCallback((dir: "next" | "prev") => {
    if (flipping.current) return;
    flipping.current = true;
    setFlip(dir);
    setTimeout(() => { dir === "next" ? rendRef.current?.next() : rendRef.current?.prev(); }, 90);
    setTimeout(() => { setFlip(null); flipping.current = false; }, 480);
  }, []);

  const toggleChrome = useCallback(() => { setSettings(false); setChrome((v) => !v); }, []);

  // --- init epub.js ---
  useEffect(() => {
    let disposed = false;
    let existing: Highlight[] = [];
    const savedTheme = (localStorage.getItem("reader.theme") as ThemeKey) || "light";
    const savedFont = Number(localStorage.getItem("reader.font")) || 100;
    setTheme(savedTheme); setFontPct(savedFont);

    (async () => {
     try {
      const ePub = (await import("epubjs")).default;
      api.book(id).then((b) => { setTitle(b.title); setAuthor(b.authors.join(", ")); }).catch(() => {});
      try { existing = (await api.highlights(id)).content; } catch {}

      if (disposed || !viewerRef.current) return;
      const buf = await fetch(api.bookFileUrl(id)).then((r) => r.arrayBuffer());
      if (disposed || !viewerRef.current) return;
      const book = ePub(buf);
      bookRef.current = book;
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%", height: "100%", flow: "paginated", spread: "none",
        allowScriptedContent: true,
      });
      rendRef.current = rendition;

      for (const key of Object.keys(THEMES) as ThemeKey[]) {
        const t = THEMES[key];
        rendition.themes.register(key, {
          "html, body": { background: `${t.bg} !important`, color: `${t.fg} !important`, "line-height": "1.6", padding: "0 8px" },
          "p, div, span, li, td, th, blockquote, h1, h2, h3, h4, h5, h6, em, strong, b, i": { color: `${t.fg} !important` },
          p: { "font-size": "1.05rem" },
          a: { color: `${t.link} !important` },
        });
      }
      rendition.themes.select(savedTheme);
      rendition.themes.fontSize(`${savedFont}%`);

      // tap-zones (left/center/right) + swipe, inside the rendered iframe
      rendition.hooks.content.register((contents: any) => {
        const doc = contents.document;
        const sgetsel = () => (contents.window.getSelection?.()?.toString?.() ?? "").trim();
        doc.addEventListener("click", (e: any) => {
          if (sgetsel()) return;                       // don't turn while selecting
          if (e.target?.closest?.("a")) return;        // let links work
          const w = contents.window.innerWidth || 1;
          const x = e.clientX;
          if (x < w * 0.28) turn("prev");
          else if (x > w * 0.72) turn("next");
          else toggleChrome();
        });
        let sx = 0, sy = 0;
        doc.addEventListener("touchstart", (e: any) => { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
        doc.addEventListener("touchend", (e: any) => {
          const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? "next" : "prev");
        }, { passive: true });
      });

      await rendition.display();
      book.loaded.navigation.then((nav: any) =>
        setToc(nav.toc.map((t: any) => ({ label: t.label.trim(), href: t.href }))),
      );

      setReady(true);
      book.ready.then(() => book.locations.generate(1200)).catch((e: any) => console.error("[reader] locations", e));

      for (const h of existing) {
        if (h.locator.value && h.locator.type === "epubcfi") {
          const hex = COLORS.find((c) => c.key === h.color)?.hex ?? "#eab308";
          try { rendition.annotations.highlight(h.locator.value, {}, () => {}, "", { fill: hex, "fill-opacity": "0.35" }); } catch {}
        }
      }

      let saveT: any;
      rendition.on("relocated", (loc: any) => {
        const p = loc?.start?.percentage ?? 0;
        setPercent(p);
        clearTimeout(saveT);
        saveT = setTimeout(() => {
          api.putProgression(id, { progression: p, totalProgression: p, page: Math.round(p * 100), totalPages: 100 }).catch(() => {});
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

    return () => { disposed = true; try { bookRef.current?.destroy(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight") turn("next");
    if (e.key === "ArrowLeft") turn("prev");
  }, [turn]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keyup", h);
    return () => window.removeEventListener("keyup", h);
  }, [onKey]);

  // apply theme / font changes live + persist
  useEffect(() => {
    try { rendRef.current?.themes.select(theme); } catch {}
    localStorage.setItem("reader.theme", theme);
  }, [theme]);
  useEffect(() => {
    try { rendRef.current?.themes.fontSize(`${fontPct}%`); } catch {}
    localStorage.setItem("reader.font", String(fontPct));
  }, [fontPct]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => { try { rendRef.current?.resize(); } catch {} }, 200); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);

  const addHighlight = async (color: HighlightColor) => {
    if (!sel) return;
    const hex = COLORS.find((c) => c.key === color)!.hex;
    try { rendRef.current.annotations.highlight(sel.cfi, {}, () => {}, "", { fill: hex, "fill-opacity": "0.35" }); } catch {}
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

  const t = THEMES[theme];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: t.bg, color: t.fg }} onClick={() => { if (sel) setSel(null); else if (settings) setSettings(false); }}>
      <style>{`
        @keyframes curlNext { 0%{transform:translateX(8%) rotateY(-12deg);opacity:0;} 40%{opacity:1;} 100%{transform:translateX(-100%) rotateY(0);opacity:0;} }
        @keyframes curlPrev { 0%{transform:translateX(-8%) rotateY(12deg);opacity:0;} 40%{opacity:1;} 100%{transform:translateX(100%) rotateY(0);opacity:0;} }
        .reader-flip-next{animation:curlNext .46s ease-in-out;transform-origin:right center;}
        .reader-flip-prev{animation:curlPrev .46s ease-in-out;transform-origin:left center;}
      `}</style>

      {/* top bar */}
      {chrome && (
        <header className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${t.fg}22` }} onClick={(e) => e.stopPropagation()}>
          <IconBtn onClick={() => setShowToc((v) => !v)} title="Оглавление" t={t}>☰</IconBtn>
          <div className="flex-1 truncate text-center text-sm" style={{ opacity: 0.8 }}>
            <span className="font-semibold">{title}</span>{author && <span style={{ opacity: 0.7 }}> — {author}</span>}
          </div>
          <IconBtn onClick={() => { setSettings((v) => !v); }} title="Вид (Aa)" t={t}>Aa</IconBtn>
          <IconBtn onClick={addBookmark} title="Закладка" t={t}>🔖</IconBtn>
          <Link href={`/book/${id}`} title="К книге" className="grid h-8 w-8 place-items-center rounded" style={{ color: t.fg, opacity: 0.7 }}>✕</Link>
        </header>
      )}

      {/* settings popover: theme + font size */}
      {settings && (
        <div className="absolute right-3 top-12 z-30 w-60 rounded-xl p-3 shadow-2xl" style={{ background: t.bg, border: `1px solid ${t.fg}33` }} onClick={(e) => e.stopPropagation()}>
          <div className="mb-1.5 text-xs uppercase tracking-wide" style={{ opacity: 0.6 }}>Тема</div>
          <div className="mb-3 flex gap-2">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
              <button key={k} onClick={() => setTheme(k)}
                className="flex-1 rounded-lg px-2 py-2 text-xs"
                style={{ background: THEMES[k].bg, color: THEMES[k].fg, outline: theme === k ? `2px solid ${t.link}` : `1px solid ${t.fg}33` }}>
                {THEMES[k].label}
              </button>
            ))}
          </div>
          <div className="mb-1.5 text-xs uppercase tracking-wide" style={{ opacity: 0.6 }}>Размер шрифта · {fontPct}%</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFontPct((f) => Math.max(80, f - 10))} className="h-8 flex-1 rounded-lg text-lg" style={{ border: `1px solid ${t.fg}33` }}>A−</button>
            <button onClick={() => setFontPct((f) => Math.min(180, f + 10))} className="h-8 flex-1 rounded-lg text-lg" style={{ border: `1px solid ${t.fg}33` }}>A+</button>
          </div>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {showToc && (
          <aside className="w-72 shrink-0 overflow-y-auto p-3" style={{ borderRight: `1px solid ${t.fg}22`, background: t.bg }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 px-2 text-xs uppercase tracking-wide" style={{ opacity: 0.6 }}>Оглавление</div>
            <ul className="flex flex-col">
              {toc.map((it, i) => (
                <li key={i}>
                  <button onClick={() => { rendRef.current?.display(it.href); setShowToc(false); }}
                    className="w-full truncate rounded px-2 py-1.5 text-left text-sm hover:opacity-100" style={{ opacity: 0.75 }}>
                    {it.label || "—"}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className="relative flex-1" style={{ perspective: "1600px" }}>
          <div ref={viewerRef} className="h-full w-full" />
          {/* page-curl overlay */}
          {flip && (
            <div className={`pointer-events-none absolute inset-0 z-20 reader-flip-${flip}`}
              style={{ background: `linear-gradient(${flip === "next" ? "90deg" : "270deg"}, ${t.bg}00 0%, ${t.bg}cc 55%, ${t.fg}22 100%)`, boxShadow: `0 0 40px ${t.fg}55` }} />
          )}
          {!ready && !err && <div className="pointer-events-none absolute inset-0 grid place-items-center" style={{ opacity: 0.5 }}>Загрузка книги…</div>}
          {err && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-500">Ошибка чтения: {err}</div>}

          {chrome && (
            <>
              <button aria-label="prev" onClick={(e) => { e.stopPropagation(); turn("prev"); }} className="absolute left-0 top-0 grid h-full w-14 place-items-center text-3xl" style={{ color: `${t.fg}33` }}>‹</button>
              <button aria-label="next" onClick={(e) => { e.stopPropagation(); turn("next"); }} className="absolute right-0 top-0 grid h-full w-14 place-items-center text-3xl" style={{ color: `${t.fg}33` }}>›</button>
            </>
          )}
          <div className="pointer-events-none absolute bottom-3 right-5 text-sm font-medium" style={{ opacity: 0.7 }}>{Math.round(percent * 100)}%</div>
        </div>
      </div>

      {sel && (
        <div className="fixed z-50 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-bg-elev2 p-2 shadow-xl" style={{ left: sel.x, top: sel.y - 8 }} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button key={c.key} onClick={() => addHighlight(c.key)} className="h-6 w-6 rounded-full ring-1 ring-white/20" style={{ backgroundColor: c.hex }} title={`Выделить (${c.key})`} />
            ))}
          </div>
        </div>
      )}

      {saved && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-bg-elev2 px-4 py-2 text-sm text-cb-text shadow-lg">{saved}</div>}
    </div>
  );
}

function IconBtn({ onClick, title, children, t }: { onClick: () => void; title: string; children: React.ReactNode; t: { fg: string } }) {
  return (
    <button onClick={onClick} title={title} className="grid h-8 w-8 place-items-center rounded text-sm hover:opacity-100" style={{ color: t.fg, opacity: 0.7 }}>
      {children}
    </button>
  );
}
