"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

export function TopBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("search") ?? "");

  useEffect(() => setQ(sp.get("search") ?? ""), [sp]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : "/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center gap-1 bg-cb-topbar px-3 text-cb-text/90">
      <IconBtn name="home" onClick={() => router.push("/")} title="Главная" />
      <IconBtn name="back" onClick={() => router.back()} title="Назад" />

      <form onSubmit={submit} className="relative ml-1 w-[360px] max-w-[40vw]">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted">
          <Icon name="search" size={16} />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 w-full rounded bg-white/10 pl-9 pr-3 text-sm text-cb-text outline-none placeholder:text-cb-muted focus:bg-white/15"
          placeholder=""
        />
      </form>

      <Link href="#" className="ml-3 flex items-center gap-2 text-sm text-cb-text/80 hover:text-white">
        <Icon name="search" size={15} /> Advanced Search
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <IconBtn name="devices" title="Отправить на устройство" />
        <IconBtn name="activity" title="Задачи" />
        <IconBtn name="sync" title="Синхронизация" />
        <IconBtn name="wrench" title="Администрирование" />
        <IconBtn name="columns" title="Вид" />
        <button className="ml-1 flex items-center gap-1 rounded px-2 py-1 hover:bg-white/10" title="Профиль">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-cb-border">
            <Icon name="user" size={16} />
          </span>
          <Icon name="caret" size={14} />
        </button>
      </div>
    </header>
  );
}

function IconBtn({ name, title, onClick }: { name: string; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="grid h-9 w-9 place-items-center rounded text-cb-text/80 hover:bg-white/10 hover:text-white"
    >
      <Icon name={name} size={18} />
    </button>
  );
}
