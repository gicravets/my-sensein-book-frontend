// Server-only adapter for the Calibre-Web-Automated backend.
// Holds a session (cookie + CSRF) and maps CWA's /ajax/listbooks JSON to our
// API contract (src/lib/types.ts). Enabled when CWA_BASE is set; the Next BFF
// routes (app/api/v1/*) call this so the browser only ever sees our contract.
import type { Book, BookFormat } from "./types";

const CWA_BASE = process.env.CWA_BASE ?? "";
const CWA_USER = process.env.CWA_USER ?? "admin";
const CWA_PASS = process.env.CWA_PASS ?? "admin123";

export const cwaEnabled = () => CWA_BASE !== "";
export const cwaBase = () => CWA_BASE;

let cookie = "";

function parseCookies(setCookie: string[] | null): string {
  if (!setCookie) return "";
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function login(): Promise<void> {
  // 1) GET /login to obtain a CSRF token + initial session cookie
  const res = await fetch(`${CWA_BASE}/login`, { redirect: "manual" });
  const initCookie = parseCookies(res.headers.getSetCookie?.() ?? null);
  const html = await res.text();
  const m = html.match(/name="csrf_token"[^>]*value="([^"]+)"/);
  const csrf = m?.[1] ?? "";

  // 2) POST credentials
  const body = new URLSearchParams({
    username: CWA_USER,
    password: CWA_PASS,
    csrf_token: csrf,
    submit: "",
  });
  const loginRes = await fetch(`${CWA_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: initCookie },
    body,
    redirect: "manual",
  });
  cookie = parseCookies(loginRes.headers.getSetCookie?.() ?? null) || initCookie;
}

async function authed(path: string, init: RequestInit = {}): Promise<Response> {
  if (!cookie) await login();
  const doFetch = () =>
    fetch(`${CWA_BASE}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), Cookie: cookie },
      redirect: "manual",
      cache: "no-store",
    });
  let res = await doFetch();
  if (res.status === 302 || res.status === 401) {
    await login(); // session expired
    res = await doFetch();
  }
  return res;
}

// raw CWA row -> our Book
interface CwaRow {
  id: number;
  title: string;
  authors?: string;
  author_sort?: string;
  comments?: string;
  tags?: string[] | string;
  series?: string;
  series_index?: number;
  languages?: string[] | string;
  publishers?: string[] | string;
  isbn?: string;
  read_status?: number | boolean;
  has_cover?: number | boolean;
  data?: { format?: string }[];
  timestamp?: string;
}

function strip(html?: string): string | null {
  if (!html) return null;
  return html.replace(/<[^>]+>/g, "").trim() || null;
}
function asArray(v?: string[] | string): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function mapBook(r: CwaRow): Book {
  const format = (r.data?.[0]?.format ?? "EPUB").toUpperCase() as BookFormat;
  const authors = (r.authors ?? r.author_sort ?? "").split(/\s*&\s*/).filter(Boolean);
  const completed = Boolean(r.read_status);
  return {
    id: String(r.id),
    title: r.title,
    authors,
    series: r.series || null,
    seriesIndex: r.series_index ?? null,
    format,
    size: 0,
    language: asArray(r.languages)[0] ?? null,
    publisher: asArray(r.publishers)[0] ?? null,
    isbn: r.isbn || null,
    description: strip(r.comments),
    tags: asArray(r.tags),
    addedAt: r.timestamp ?? new Date().toISOString(),
    coverSeed: r.title,
    coverUrl: r.has_cover ? `/api/cwa/cover/${r.id}` : null,
    readProgress: completed
      ? { progression: 1, totalProgression: 1, page: 0, totalPages: 0, completed: true, lastReadAt: null, deviceName: null }
      : null,
    shelfIds: [],
    rating: 0,
    archived: false,
  };
}

export async function cwaListBooks(): Promise<Book[]> {
  const res = await authed(`/ajax/listbooks?start=0&length=1000`);
  const json = (await res.json()) as { rows?: CwaRow[] };
  return (json.rows ?? []).map(mapBook);
}

export async function cwaGetBook(id: string): Promise<Book | null> {
  const all = await cwaListBooks();
  return all.find((b) => b.id === id) ?? null;
}

export async function cwaCover(id: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  const res = await authed(`/cover/${id}`);
  if (res.status !== 200) return null;
  return { body: await res.arrayBuffer(), type: res.headers.get("content-type") ?? "image/jpeg" };
}

export async function cwaBookFile(id: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  const res = await authed(`/download/${id}/epub/book`);
  if (res.status !== 200) return null;
  return { body: await res.arrayBuffer(), type: "application/epub+zip" };
}
