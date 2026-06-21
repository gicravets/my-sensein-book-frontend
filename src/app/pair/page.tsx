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

  const start = useCallback(async () => {
    setStatus("pending"); setDeviceName(""); setQr(null); setToken(null);
    try {
      const p = await api.createPairing();
      if (!p) return;
      setQr(p.qr); setToken(p.token);
    } catch { setStatus("error"); }
  }, []);

  useEffect(() => { start(); }, [start]);

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
