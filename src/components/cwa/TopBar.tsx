"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { api } from "@/lib/api";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("search") ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadBook(file);
      router.push("/");
      router.refresh();
    } catch (err) {
      alert("Не удалось загрузить книгу: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => setQ(sp.get("search") ?? ""), [sp]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center gap-1 bg-cb-topbar px-2 text-cb-text/90 sm:px-3">
      <IconBtn name="list" onClick={onMenu} title="Меню" className="lg:hidden" />
      <IconBtn name="home" onClick={() => router.push("/")} title="Главная" className="hidden sm:grid" />
      <IconBtn name="back" onClick={() => router.back()} title="Назад" className="hidden sm:grid" />

      <form onSubmit={submit} className="relative ml-1 min-w-0 flex-1 lg:w-[360px] lg:flex-none">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted">
          <Icon name="search" size={16} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 w-full rounded bg-white/10 pl-9 pr-3 text-sm text-cb-text outline-none placeholder:text-cb-muted focus:bg-white/15"
          placeholder="Поиск…"
        />
      </form>

      <Link href="/advanced" className="ml-3 hidden items-center gap-2 text-sm text-cb-text/80 transition-colors hover:text-white xl:flex">
        <Icon name="search" size={15} /> Advanced Search
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <input ref={fileRef} type="file" accept=".epub,application/epub+zip" hidden onChange={onUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          title="Загрузить книгу (EPUB)"
          className={`grid h-9 w-9 place-items-center rounded hover:bg-white/10 hover:text-white ${uploading ? "animate-pulse text-cb-accent" : "text-cb-text/80"}`}
        >
          <Icon name="upload" size={18} />
        </button>
        <IconBtn name="devices" title="Связать устройство" className="hidden md:grid" onClick={() => router.push("/pair")} />
        <IconBtn name="activity" title="Устройства" className="hidden md:grid" onClick={() => router.push("/devices")} />
        <IconBtn name="sync" title="Обновить" className="hidden md:grid" onClick={() => router.refresh()} />
        <IconBtn name="wrench" title="Расширенный поиск" className="hidden md:grid" onClick={() => router.push("/advanced")} />
        <IconBtn name="columns" title="Вид списком" className="hidden lg:grid" onClick={() => router.push("/?view=list")} />
        <div className="relative ml-1">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-white/10" title="Профиль">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-cb-border">
              <Icon name="user" size={16} />
            </span>
            <Icon name="caret" size={14} className="hidden sm:block" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-lg border border-cb-border bg-cb-panel py-1 shadow-xl">
                <Link href="/pair" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-cb-text/90 hover:bg-white/5 hover:text-white">📱 Связать устройство</Link>
                <Link href="/devices" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-cb-text/90 hover:bg-white/5 hover:text-white">🖥️ Устройства</Link>
                <Link href="/advanced" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-cb-text/90 hover:bg-white/5 hover:text-white">🔍 Расширенный поиск</Link>
                <div className="my-1 border-t border-cb-border/60" />
                <div className="px-4 py-2 text-xs text-cb-muted">My.Sensein.Book</div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function IconBtn({ name, title, onClick, className = "" }: { name: string; title: string; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-9 w-9 place-items-center rounded text-cb-text/80 hover:bg-white/10 hover:text-white ${className}`}
    >
      <Icon name={name} size={18} />
    </button>
  );
}
