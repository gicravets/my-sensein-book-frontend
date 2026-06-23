"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";

// Server-side QR pairing: show a QR the iOS app scans to link a device.
export default function PairPage() {
  const [qr, setQr] = useState<{ url: string; t: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "claimed" | "expired" | "error">("pending");
  const [deviceName, setDeviceName] = useState("");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  // family users: pick who the scanned device joins
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [newUser, setNewUser] = useState("");

  useEffect(() => { api.users().then((r) => setUsers(r.content)).catch(() => {}); }, []);

  const start = useCallback(async () => {
    setStatus("pending"); setDeviceName(""); setQr(null); setToken(null);
    try {
      const p = await api.createPairing(userId || undefined);
      if (!p) return;
      setQr(p.qr); setToken(p.token);
    } catch { setStatus("error"); }
  }, [userId]);

  useEffect(() => { start(); }, [start]);

  const addUser = async () => {
    const name = newUser.trim();
    if (!name) return;
    try {
      const u = await api.createUser(name);
      if (u) { setUsers((prev) => [...prev, u]); setUserId(u.id); setNewUser(""); }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!token) return;
    poll.current = setInterval(async () => {
      try {
        const s = await api.pairingStatus(token);
        if (s.status === "claimed") { setStatus("claimed"); setDeviceName(s.deviceName); clearInterval(poll.current!); }
        else if (s.status === "expired") { setStatus("expired"); clearInterval(poll.current!); }
      } catch { /* keep polling */ }
    }, 2000);
    return () => { if (poll.current) clearInterval(poll.current); };
  }, [token]);

  // QR encodes the JSON the iOS app expects: {url, t}
  const payload = qr ? JSON.stringify(qr) : "";

  return (
    <div className="mx-auto max-w-md px-6 py-8 text-center">
      <h1 className="mb-2 text-lg font-semibold">Связать устройство</h1>
      <p className="mb-6 text-sm text-cb-muted">
        Откройте My.Sensein.Book на iPhone/iPad и отсканируйте QR-код, чтобы привязать устройство к серверу.
      </p>

      <div className="mb-3 flex items-center justify-center gap-2 text-sm">
        <span className="text-cb-muted">Кому:</span>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-md border border-white/15 bg-transparent px-2 py-1"
        >
          <option value="">Владелец</option>
          {users.filter((u) => u.id !== "u-owner").map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-6 flex items-center justify-center gap-2 text-sm">
        <input
          value={newUser}
          onChange={(e) => setNewUser(e.target.value)}
          placeholder="Новый пользователь"
          className="w-40 rounded-md border border-white/15 bg-transparent px-2 py-1"
        />
        <button onClick={addUser} className="rounded-md border border-white/15 px-2.5 py-1 hover:bg-white/10">
          Добавить
        </button>
      </div>

      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl bg-white p-4">
        {status === "claimed" ? (
          <div className="text-emerald-600">
            <div className="text-5xl">✓</div>
            <div className="mt-2 font-semibold text-[#222]">Привязано</div>
          </div>
        ) : status === "expired" || status === "error" ? (
          <div className="text-[#222]">{status === "expired" ? "Код истёк" : "Ошибка"}</div>
        ) : payload ? (
          <QRCodeSVG value={payload} size={224} level="M" />
        ) : (
          <div className="text-cb-muted">…</div>
        )}
      </div>

      <div className="mt-5 text-sm">
        {status === "pending" && <span className="text-cb-muted">Ожидание сканирования… (код действителен 5 мин)</span>}
        {status === "claimed" && <span className="text-cb-text">Устройство <b>{deviceName}</b> привязано. Синхронизация активна.</span>}
        {(status === "expired" || status === "error") && (
          <button onClick={start} className="rounded-[40px] bg-cb-accent px-6 py-2 font-semibold uppercase text-white transition-colors hover:bg-cb-accent-hover">
            Новый код
          </button>
        )}
      </div>

      {status === "claimed" && (
        <button onClick={start} className="mt-4 text-sm text-cb-accent hover:underline">Привязать ещё одно устройство</button>
      )}
    </div>
  );
}
