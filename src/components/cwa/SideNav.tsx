"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Shelf } from "@/lib/types";
import { Icon } from "./Icon";

const BROWSE: { icon: string; label: string; href: string }[] = [
  { icon: "book", label: "Books", href: "/" },
  { icon: "fire", label: "Hot Books", href: "/?filter=hot" },
  { icon: "download", label: "Downloaded Books", href: "/?filter=downloaded" },
  { icon: "star", label: "Top Rated Books", href: "/?filter=rated&sort=rating" },
  { icon: "eye", label: "Read Books", href: "/?filter=read" },
  { icon: "eyeSlash", label: "Unread Books", href: "/?filter=unread" },
  { icon: "shuffle", label: "Discover", href: "/?sort=random" },
  { icon: "tag", label: "Categories", href: "/browse/categories" },
  { icon: "bookmark", label: "Series", href: "/browse/series" },
  { icon: "user", label: "Authors", href: "/browse/authors" },
  { icon: "text", label: "Publishers", href: "/browse/publishers" },
  { icon: "flag", label: "Languages", href: "/browse/languages" },
  { icon: "star", label: "Ratings", href: "/?filter=rated&sort=rating" },
  { icon: "file", label: "File formats", href: "/browse/formats" },
  { icon: "archive", label: "Archived Books", href: "/?filter=archived" },
  { icon: "list", label: "Books List", href: "/?view=list" },
];

export function SideNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [series, setSeries] = useState<{ name: string; bookCount: number }[]>([]);

  const loadShelves = () => api.shelves().then((r) => setShelves(r.content)).catch(() => {});
  useEffect(() => { loadShelves(); }, []);
  useEffect(() => { api.series().then((r) => setSeries(r.content)).catch(() => {}); }, []);

  const createShelf = async () => {
    const name = window.prompt("Название полки");
    if (!name?.trim()) return;
    await api.createShelf(name.trim()).catch(() => {});
    await loadShelves();
    router.refresh();
  };

  const activeShelf = sp.get("shelf");
  const normal = shelves.filter((s) => s.kind === "normal");
  const smart = shelves.filter((s) => s.kind === "smart");

  return (
    <>
      {/* mobile backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        onClick={onClose}
        className={`fixed bottom-0 left-0 top-[52px] z-40 flex w-64 shrink-0 flex-col overflow-y-auto bg-cb-sidebar transition-transform lg:static lg:top-0 lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:flex`}
      >
      <Link href="/" className="block px-5 pb-4 pt-4 text-[17px] font-bold text-cb-gold">
        My.Sensein.Book
      </Link>

      <Section title="Browse">
        {BROWSE.map((it) => {
          const active =
            it.href === "/" ? path === "/" && !activeShelf && !sp.get("filter") : false;
          return <NavItem key={it.label} {...it} active={active} />;
        })}
      </Section>

      <Section title="Shelves">
        {normal.map((s) => (
          <div key={s.id} className="group relative">
            <NavItem
              icon="bookmark"
              label={s.name}
              href={`/?shelf=${s.id}`}
              count={s.bookCount}
              active={activeShelf === s.id}
            />
            <button
              title={s.isPublic ? "Общая полка (видна семье)" : "Сделать общей для семьи"}
              onClick={async (e) => {
                e.preventDefault();
                await api.setShelfPublic(s.id, !s.isPublic).catch(() => {});
                loadShelves();
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${
                s.isPublic
                  ? "text-emerald-400"
                  : "text-cb-muted opacity-0 group-hover:opacity-100 hover:text-white"
              }`}
            >
              <Icon name={s.isPublic ? "eye" : "eyeSlash"} size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={createShelf}
          className="flex w-full items-center gap-3 px-5 py-[7px] text-left text-[14px] text-cb-text/85 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span className="text-cb-muted/90"><Icon name="plus" size={16} /></span>
          <span className="flex-1 truncate">Create Shelf</span>
        </button>
      </Section>

      {smart.length > 0 && (
        <Section title="Magic Shelves ✨">
          {smart.map((s) => (
            <NavItem
              key={s.id}
              icon="star"
              label={s.name}
              href={`/?shelf=${s.id}`}
              count={s.bookCount}
              active={activeShelf === s.id}
            />
          ))}
          <NavItem icon="plus" label="Create Magic Shelf" href="#" />
        </Section>
      )}

      {series.length > 0 && (
        <Section title="Серии">
          {series.map((s) => (
            <NavItem
              key={s.name}
              icon="book"
              label={s.name}
              href={`/?series=${encodeURIComponent(s.name)}`}
              count={s.bookCount}
              active={sp.get("series") === s.name}
            />
          ))}
        </Section>
      )}
      <div className="h-6" />
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-cb-muted">
        {title}
      </div>
      <nav>{children}</nav>
    </div>
  );
}

function NavItem({
  icon, label, href, count, active,
}: { icon: string; label: string; href: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-5 py-[7px] text-[14px] transition-colors ${
        active
          ? "bg-cb-accent/90 text-white"
          : "text-cb-text/85 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="text-cb-muted/90"><Icon name={icon} size={16} /></span>
      <span className="flex-1 truncate">{label}</span>
      {count != null && <span className="text-xs text-cb-muted">{count}</span>}
    </Link>
  );
}
