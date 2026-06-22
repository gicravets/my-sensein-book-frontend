"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

// Thin status bar: demo banner, "set up server" prompt, and an update chip.
export function ServerStatus() {
  const [demo, setDemo] = useState(false);
  const [claimed, setClaimed] = useState(true);
  const [update, setUpdate] = useState<{ latest: string; url: string } | null>(null);

  useEffect(() => {
    api.setup().then((s) => { setDemo(s.demo); setClaimed(s.claimed); }).catch(() => {});
    api.checkUpdate().then((u) => { if (u.updateAvailable) setUpdate({ latest: u.latest, url: u.url }); }).catch(() => {});
  }, []);

  if (!demo && claimed && !update) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-1.5 text-xs">
      {demo && (
        <span className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-300">
          Демо-режим · только чтение
        </span>
      )}
      {!claimed && !demo && (
        <Link href="/setup" className="rounded-md bg-[#B14EE0]/20 px-2 py-1 text-[#D6A3F0] hover:bg-[#B14EE0]/30">
          Сервер не настроен · Настроить →
        </Link>
      )}
      {update && (
        <a
          href={update.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300 hover:bg-emerald-500/25"
        >
          Доступно обновление {update.latest} ↗
        </a>
      )}
    </div>
  );
}
