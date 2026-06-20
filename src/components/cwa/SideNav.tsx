"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Shelf } from "@/lib/types";
import { Icon } from "./Icon";

const BROWSE: { icon: string; label: string; href: string }[] = [
  { icon: "book", label: "Books", href: "/" },
  { icon: "fire", label: "Hot Books", href: "#" },
  { icon: "download", label: "Downloaded Books", href: "#" },
  { icon: "star", label: "Top Rated Books", href: "#" },
  { icon: "eye", label: "Read Books", href: "/?filter=read" },
  { icon: "eyeSlash", label: "Unread Books", href: "/?filter=unread" },
  { icon: "shuffle", label: "Discover", href: "#" },
  { icon: "tag", label: "Categories", href: "#" },
  { icon: "bookmark", label: "Series", href: "#" },
  { icon: "user", label: "Authors", href: "#" },
  { icon: "text", label: "Publishers", href: "#" },
  { icon: "flag", label: "Languages", href: "#" },
  { icon: "star", label: "Ratings", href: "#" },
  { icon: "file", label: "File formats", href: "#" },
  { icon: "archive", label: "Archived Books", href: "#" },
  { icon: "list", label: "Books List", href: "#" },
];

export function SideNav() {
  const path = usePathname();
  const sp = useSearchParams();
  const [shelves, setShelves] = useState<Shelf[]>([]);

  useEffect(() => {
    api.shelves().then((r) => setShelves(r.content)).catch(() => {});
  }, []);

  const activeShelf = sp.get("shelf");
  const normal = shelves.filter((s) => s.kind === "normal");
  const smart = shelves.filter((s) => s.kind === "smart");

  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto bg-cb-sidebar/95 sm:flex">
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
          <NavItem
            key={s.id}
            icon="bookmark"
            label={s.name}
            href={`/?shelf=${s.id}`}
            count={s.bookCount}
            active={activeShelf === s.id}
          />
        ))}
        <NavItem icon="plus" label="Create Shelf" href="#" />
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
      <div className="h-6" />
    </aside>
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
