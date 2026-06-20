"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Библиотека", icon: "📚" },
  { href: "/shelves", label: "Полки", icon: "🗂️" },
  { href: "/highlights", label: "Выделения", icon: "🖍️" },
  { href: "/bookmarks", label: "Закладки", icon: "🔖" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-bg-elev px-3 py-5 sm:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-sm font-bold">
          M
        </span>
        <span className="text-lg font-semibold tracking-tight">MyReader</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-bg-elev2 text-text"
                  : "text-text-dim hover:bg-bg-elev2/60 hover:text-text"
              }`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 text-[11px] text-text-dim">
        Мок-API · контракт для Go-бэка
      </div>
    </aside>
  );
}
