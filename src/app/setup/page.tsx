"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// First-run wizard (Komga-style claim): create the admin key on a fresh server.
export default function SetupPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "needed" | "claiming" | "done">("loading");
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.setup().then((s) => setState(s.claimed ? "done" : "needed")).catch(() => setState("needed"));
  }, []);

  useEffect(() => {
    if (state === "done" && !apiKey) {
      const t = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(t);
    }
  }, [state, apiKey, router]);

  const claim = async () => {
    setState("claiming");
    setErr(null);
    try {
      const r = await api.claimSetup();
      if (r?.apiKey) setApiKey(r.apiKey);
      setState("done");
    } catch (e) {
      setErr(String(e));
      setState("needed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B14EE0]/20 text-2xl">
          📖
        </div>
        <h1 className="text-lg font-medium">My.Sensein.Book</h1>

        {state === "loading" && <p className="mt-3 text-sm text-white/50">Проверка сервера…</p>}

        {state === "needed" && (
          <>
            <p className="mt-2 text-sm text-white/60">
              Первый запуск. Создайте администратора, чтобы начать.
            </p>
            <button
              onClick={claim}
              className="mt-5 w-full rounded-xl bg-[#B14EE0] py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Создать сервер
            </button>
            {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
          </>
        )}

        {state === "claiming" && <p className="mt-3 text-sm text-white/50">Создание…</p>}

        {state === "done" && apiKey && (
          <>
            <p className="mt-2 text-sm text-white/60">
              Готово. Сохраните ключ администратора — он показан один раз.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
              <code className="min-w-0 flex-1 truncate text-left text-xs text-white/80">{apiKey}</code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(apiKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/10"
              >
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
            <button
              onClick={() => router.push("/")}
              className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium transition hover:bg-white/15"
            >
              В библиотеку
            </button>
          </>
        )}

        {state === "done" && !apiKey && (
          <p className="mt-3 text-sm text-white/50">Сервер уже настроен. Перенаправление…</p>
        )}
      </div>
    </div>
  );
}
