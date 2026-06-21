"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Device = { id: string; name: string; created: string };

// Linked devices management: list paired devices + revoke their key.
export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[] | null>(null);

  const load = useCallback(() => {
    api.devices().then((r) => setDevices(r.content)).catch(() => setDevices([]));
  }, []);
  useEffect(() => { load(); }, [load]);

  const revoke = async (d: Device) => {
    if (!window.confirm(`Отозвать доступ для «${d.name}»? Устройство перестанет синхронизироваться.`)) return;
    await api.deleteDevice(d.id).catch(() => {});
    load();
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="mr-auto text-lg font-semibold">Устройства</h1>
        <Link href="/pair" className="rounded-[40px] bg-cb-accent px-5 py-2 text-sm font-semibold uppercase text-white transition-colors hover:bg-cb-accent-hover">
          + Привязать
        </Link>
      </div>

      {devices === null ? (
        <p className="text-cb-muted">Загрузка…</p>
      ) : devices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-cb-border px-4 py-8 text-center text-cb-muted">
          Нет привязанных устройств. <Link href="/pair" className="text-cb-accent hover:underline">Привязать</Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg border border-cb-border bg-cb-panel px-4 py-3">
              <span className="text-xl">📱</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-cb-text">{d.name}</div>
                <div className="text-xs text-cb-muted">привязано {new Date(d.created).toLocaleString("ru")}</div>
              </div>
              <button onClick={() => revoke(d)} className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10">
                Отозвать
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
