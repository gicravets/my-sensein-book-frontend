"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Highlight, HighlightColor, Bookmark } from "@/lib/types";

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

  // read-aloud via Web Speech API (desktop-first; iOS Safari is limited)
  const [tts, setTts] = useState<"idle" | "playing" | "paused">("idle");
  const ttsOn = useRef(false);
  const sectionText = () => {
    try {
      const cs = rendRef.current?.getContents?.() ?? [];
      const arr = Array.isArray(cs) ? cs : [cs];
      return arr.map((c: any) => c?.document?.body?.innerText ?? "").join(" ").trim();
    } catch { return ""; }
  };
  const speakCurrent = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const text = sectionText();
    if (!text) { ttsOn.current = false; setTts("idle"); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.onend = () => {
      if (!ttsOn.current) return;
      const p = rendRef.current?.next?.();
      if (p && typeof p.then === "function") {
        p.then(() => setTimeout(() => { if (ttsOn.current) speakCurrent(); }, 350));
      } else {
        ttsOn.current = false;
        setTts("idle");
      }
    };
    synth.cancel();
    synth.speak(u);
    setTts("playing");
  }, []);
  const toggleTTS = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (tts === "playing") { synth.pause(); setTts("paused"); }
    else if (tts === "paused") { synth.resume(); setTts("playing"); }
    else { ttsOn.current = true; speakCurrent(); }
  }, [tts, speakCurrent]);
  const stopTTS = useCallback(() => { ttsOn.current = false; window.speechSynthesis?.cancel(); setTts("idle"); }, []);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // reader-prefs sync: server is the source of truth on load; changes PUT debounced.
  const prefsLoaded = useRef(false);
  const prefsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncPrefs = useCallback((theme: ThemeKey, fontPct: number) => {
    if (!prefsLoaded.current) return; // don't clobber server with defaults before first load
    if (prefsTimer.current) clearTimeout(prefsTimer.current);
    prefsTimer.current = setTimeout(() => {
      api.putPreferences({ theme, fontPct }).catch(() => {});
    }, 600);
  }, []);

  // annotations panel (highlights + bookmarks list, jump to location)
  const [annots, setAnnots] = useState(false);
  const [hls, setHls] = useState<Highlight[]>([]);
  const [bms, setBms] = useState<Bookmark[]>([]);

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

      // pull synced reader prefs (cross-device); server wins over local on load
      api.preferences().then((p) => {
        if (disposed || !p) return;
        if (typeof p.theme === "string" && THEMES[p.theme as ThemeKey]) {
          const t = p.theme as ThemeKey;
          setTheme(t); rendition.themes.select(t); localStorage.setItem("reader.theme", t);
        }
        if (typeof p.fontPct === "number") {
          setFontPct(p.fontPct); rendition.themes.fontSize(`${p.fontPct}%`);
          localStorage.setItem("reader.font", String(p.fontPct));
        }
      }).catch(() => {}).finally(() => { prefsLoaded.current = true; });

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
      // re-fit after layout settles so the column width matches the viewport (no clipping)
      const refit = () => { const v = viewerRef.current; if (v) { try { rendition.resize(v.clientWidth, v.clientHeight); } catch {} } };
      requestAnimationFrame(refit); setTimeout(refit, 350);
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

  // apply theme / font changes live + persist. epub.js doesn't reliably repaint
  // already-rendered content on theme/font change (esp. Safari), so re-display the
  // current page to force a re-render with the new styles.
  const reapply = useCallback(() => {
    const r = rendRef.current;
    if (!r) return;
    try {
      r.themes.select(theme);
      r.themes.fontSize(`${fontPct}%`);
      const cfi = r.currentLocation?.()?.start?.cfi;
      if (cfi) r.display(cfi);
    } catch {}
  }, [theme, fontPct]);
  useEffect(() => { reapply(); localStorage.setItem("reader.theme", theme); syncPrefs(theme, fontPct); }, [theme, reapply, fontPct, syncPrefs]);
  useEffect(() => { reapply(); localStorage.setItem("reader.font", String(fontPct)); syncPrefs(theme, fontPct); }, [fontPct, reapply, theme, syncPrefs]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => { const v = viewerRef.current; if (v) { try { rendRef.current?.resize(v.clientWidth, v.clientHeight); } catch {} } }, 200); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);

  const addHighlight = async (color: HighlightColor) => {
    if (!sel) return;
    const hex = COLORS.find((c) => c.key === color)!.hex;
    try { rendRef.current.annotations.highlight(sel.cfi, {}, () => {}, "", { fill: hex, "fill-opacity": "0.35" }); } catch {}
    const created = await api.createHighlight({
      bookId: id, text: sel.text, color,
      locator: { href: null, type: "epubcfi", value: sel.cfi, progression: percent },
    }).catch(() => null);
    if (created) setHls((l) => [created, ...l]);
    rendRef.current?.getContents?.().forEach?.((c: any) => c.window.getSelection().removeAllRanges());
    setSel(null);
    flash("Выделение сохранено");
  };

  const addBookmark = async () => {
    const loc = rendRef.current?.currentLocation?.();
    const cfi = loc?.start?.cfi ?? null;
    const created = await api.createBookmark({
      bookId: id, label: `Закладка · ${Math.round(percent * 100)}%`,
      locator: { href: null, type: "epubcfi", value: cfi, progression: percent },
    }).catch(() => null);
    if (created) setBms((b) => [created, ...b]);
    flash("Закладка добавлена");
  };

  const loadAnnots = useCallback(async () => {
    try { setHls((await api.highlights(id)).content); } catch {}
    try { setBms((await api.bookmarks(id)).content); } catch {}
  }, [id]);

  const jumpTo = (value: string | null) => {
    if (value) { try { rendRef.current?.display(value); } catch {} }
    setAnnots(false);
  };

  const deleteHl = async (h: Highlight) => {
    await api.deleteHighlight(h.id).catch(() => {});
    setHls((l) => l.filter((x) => x.id !== h.id));
    if (h.locator.value) { try { rendRef.current?.annotations.remove(h.locator.value, "highlight"); } catch {} }
  };
  const deleteBm = async (b: Bookmark) => {
    await api.deleteBookmark(b.id).catch(() => {});
    setBms((l) => l.filter((x) => x.id !== b.id));
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
        <header className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${t.fg}22`, paddingTop: "calc(0.625rem + env(safe-area-inset-top))" }} onClick={(e) => e.stopPropagation()}>
          <IconBtn onClick={() => setShowToc((v) => !v)} title="Оглавление" t={t}>☰</IconBtn>
          <div className="flex-1 truncate text-center text-sm" style={{ opacity: 0.8 }}>
            <span className="font-semibold">{title}</span>{author && <span style={{ opacity: 0.7 }}> — {author}</span>}
          </div>
          <IconBtn onClick={() => { setSettings((v) => !v); }} title="Вид (Aa)" t={t}>Aa</IconBtn>
          <IconBtn onClick={addBookmark} title="Добавить закладку" t={t}>🔖</IconBtn>
          <IconBtn onClick={() => { setAnnots(true); loadAnnots(); }} title="Заметки и закладки" t={t}>📑</IconBtn>
          <IconBtn onClick={toggleTTS} title="Читать вслух" t={t}>{tts === "playing" ? "⏸" : "🎧"}</IconBtn>
          {tts !== "idle" && <IconBtn onClick={stopTTS} title="Стоп" t={t}>⏹</IconBtn>}
          <Link href={`/book/${id}`} title="К книге" className="grid h-10 w-10 place-items-center rounded-lg active:scale-90" style={{ color: t.fg, opacity: 0.75 }}>✕</Link>
        </header>
      )}

      {/* settings: bottom sheet with large touch targets (phone + tablet) */}
      {settings && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={() => setSettings(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl p-5 shadow-2xl"
            style={{ background: t.bg, borderTop: `1px solid ${t.fg}22`, paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full" style={{ background: `${t.fg}40` }} />
            <div className="mb-2 text-xs uppercase tracking-wide" style={{ opacity: 0.6 }}>Тема</div>
            <div className="mb-6 grid grid-cols-3 gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                <button key={k} onClick={() => setTheme(k)}
                  className="flex h-20 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-medium"
                  style={{ background: THEMES[k].bg, color: THEMES[k].fg, outline: theme === k ? `2.5px solid ${t.link}` : `1px solid ${t.fg}33`, outlineOffset: "-1px" }}>
                  <span className="text-2xl" style={{ fontFamily: "Georgia, serif" }}>Aa</span>
                  {THEMES[k].label}
                </button>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide" style={{ opacity: 0.6 }}>
              <span>Размер шрифта</span><span>{fontPct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setFontPct((f) => Math.max(80, f - 10))} className="h-16 flex-1 rounded-2xl text-2xl font-semibold active:scale-95" style={{ border: `1px solid ${t.fg}33` }}>A−</button>
              <button onClick={() => setFontPct((f) => Math.min(200, f + 10))} className="h-16 flex-1 rounded-2xl text-3xl font-semibold active:scale-95" style={{ border: `1px solid ${t.fg}33` }}>A+</button>
            </div>
          </div>
        </>
      )}

      {/* annotations panel — highlights + bookmarks, jump to location */}
      {annots && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setAnnots(false)} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-[88%] max-w-sm flex-col p-4 shadow-2xl" style={{ background: t.bg, borderLeft: `1px solid ${t.fg}22`, paddingTop: "calc(1rem + env(safe-area-inset-top))" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="mr-auto text-base font-semibold">Заметки и закладки</h2>
              <button onClick={() => setAnnots(false)} className="grid h-9 w-9 place-items-center rounded-lg active:scale-90" style={{ color: t.fg, opacity: 0.7 }}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {hls.length === 0 && bms.length === 0 && (
                <p className="py-12 text-center text-sm" style={{ opacity: 0.5 }}>Пока нет выделений и закладок.<br />Выделите текст или нажмите 🔖.</p>
              )}
              {bms.length > 0 && (
                <>
                  <div className="mb-1.5 mt-1 text-xs uppercase tracking-wide" style={{ opacity: 0.5 }}>Закладки</div>
                  {bms.map((b) => (
                    <div key={b.id} className="group mb-1.5 flex items-center gap-2 rounded-lg px-2 py-2" style={{ background: `${t.fg}08` }}>
                      <button onClick={() => jumpTo(b.locator.value)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        <span style={{ color: t.link }}>🔖</span>
                        <span className="truncate text-sm">{b.label}</span>
                      </button>
                      <button onClick={() => deleteBm(b)} className="shrink-0 px-1 text-sm opacity-50 hover:opacity-100" title="Удалить">🗑</button>
                    </div>
                  ))}
                </>
              )}
              {hls.length > 0 && (
                <>
                  <div className="mb-1.5 mt-3 text-xs uppercase tracking-wide" style={{ opacity: 0.5 }}>Выделения</div>
                  {hls.map((h) => (
                    <div key={h.id} className="group mb-1.5 rounded-lg px-2 py-2" style={{ background: `${t.fg}08` }}>
                      <div className="flex items-start gap-2">
                        <button onClick={() => jumpTo(h.locator.value)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                          <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS.find((c) => c.key === h.color)?.hex ?? "#eab308" }} />
                          <span className="text-sm leading-snug line-clamp-3">{h.text}</span>
                        </button>
                        <button onClick={() => deleteHl(h)} className="shrink-0 px-1 text-sm opacity-50 hover:opacity-100" title="Удалить">🗑</button>
                      </div>
                      {h.note && <p className="mt-1 pl-5 text-xs" style={{ opacity: 0.65 }}>📝 {h.note}</p>}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {showToc && (
          <div className="absolute inset-0 z-10 bg-black/40 md:hidden" onClick={(e) => { e.stopPropagation(); setShowToc(false); }} />
        )}
        {showToc && (
          <aside className="absolute left-0 top-0 z-20 h-full w-[82%] max-w-xs overflow-y-auto p-3 shadow-2xl md:static md:z-0 md:w-72 md:shadow-none" style={{ borderRight: `1px solid ${t.fg}22`, background: t.bg }} onClick={(e) => e.stopPropagation()}>
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

        <div className="relative min-w-0 flex-1 overflow-hidden" style={{ perspective: "1600px" }}>
          <div ref={viewerRef} className="h-full w-full" />
          {/* page-curl overlay */}
          {flip && (
            <div className={`pointer-events-none absolute inset-0 z-20 reader-flip-${flip}`}
              style={{ background: `linear-gradient(${flip === "next" ? "90deg" : "270deg"}, ${t.bg}00 0%, ${t.bg}cc 55%, ${t.fg}22 100%)`, boxShadow: `0 0 40px ${t.fg}55` }} />
          )}
          {/* side reading-progress rail (always visible) — marker travels 0→100% */}
          {ready && (
            <div className="pointer-events-none absolute left-1 z-10 w-[3px] rounded-full" style={{ top: "calc(env(safe-area-inset-top) + 8px)", bottom: "calc(env(safe-area-inset-bottom) + 8px)", background: `${t.fg}1f` }}>
              <div className="absolute left-0 top-0 w-full rounded-full" style={{ height: `${Math.round(percent * 100)}%`, background: t.link, opacity: 0.85 }} />
              <div className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full" style={{ top: `calc(${percent * 100}% - 5px)`, background: t.link, boxShadow: "0 0 4px rgba(0,0,0,.45)" }} />
            </div>
          )}
          {!ready && !err && <div className="pointer-events-none absolute inset-0 grid place-items-center" style={{ opacity: 0.5 }}>Загрузка книги…</div>}
          {err && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-red-500">Ошибка чтения: {err}</div>}

          {chrome && (
            <>
              {/* desktop chevrons; on phone use tap-zones + swipe */}
              <button aria-label="prev" onClick={(e) => { e.stopPropagation(); turn("prev"); }} className="absolute left-0 top-0 hidden h-full w-14 place-items-center text-3xl md:grid" style={{ color: `${t.fg}33` }}>‹</button>
              <button aria-label="next" onClick={(e) => { e.stopPropagation(); turn("next"); }} className="absolute right-0 top-0 hidden h-full w-14 place-items-center text-3xl md:grid" style={{ color: `${t.fg}33` }}>›</button>
            </>
          )}
          <div className="pointer-events-none absolute right-5 text-sm font-medium" style={{ opacity: 0.7, bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>{Math.round(percent * 100)}%</div>
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
    <button onClick={onClick} title={title} className="grid h-10 w-10 place-items-center rounded-lg text-base hover:opacity-100 active:scale-90" style={{ color: t.fg, opacity: 0.75 }}>
      {children}
    </button>
  );
}
