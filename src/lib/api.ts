// Typed API client. Base URL is switchable: empty = same-origin mock (app/api/*),
// later point NEXT_PUBLIC_API_BASE at the Go backend implementing the same contract.
import type { Book, Shelf, Bookmark, Highlight, Locator, ReadProgress, Page } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json() as Promise<T>;
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  if (res.status === 204) return null;
  return res.json() as Promise<T>;
}

export type SortKey =
  | "recent" | "recent_old" | "title" | "title_desc"
  | "author" | "author_desc" | "pub" | "pub_desc" | "progress" | "random";

export interface BookQuery {
  search?: string;
  shelf?: string;
  tag?: string;
  author?: string;
  series?: string;
  language?: string;
  publisher?: string;
  format?: string;
  filter?: string; // read | unread | archived | rated | downloaded | hot
  sort?: SortKey;
  page?: number;
  size?: number;
}

// A smart shelf is a saved subset of a book query (the "rule").
export type SmartRules = Pick<BookQuery, "filter" | "search" | "tag" | "author" | "sort">;
export interface SmartShelf {
  id: string;
  name: string;
  rules: SmartRules;
}

export const api = {
  books: (q: BookQuery = {}) => {
    const sp = new URLSearchParams();
    if (q.search) sp.set("search", q.search);
    if (q.shelf) sp.set("shelf", q.shelf);
    if (q.tag) sp.set("tag", q.tag);
    if (q.author) sp.set("author", q.author);
    if (q.series) sp.set("series", q.series);
    if (q.language) sp.set("language", q.language);
    if (q.publisher) sp.set("publisher", q.publisher);
    if (q.format) sp.set("format", q.format);
    if (q.filter) sp.set("filter", q.filter);
    if (q.sort) sp.set("sort", q.sort);
    if (q.page != null) sp.set("page", String(q.page));
    if (q.size != null) sp.set("size", String(q.size));
    const qs = sp.toString();
    return get<Page<Book>>(`/api/v1/books${qs ? `?${qs}` : ""}`);
  },
  book: (id: string) => get<Book>(`/api/v1/books/${id}`),
  shelves: () => get<{ content: Shelf[]; totalElements: number }>(`/api/v1/shelves`),
  createShelf: (name: string) => send<Shelf>("POST", `/api/v1/shelves`, { name }),
  deleteShelf: (id: string) => send<null>("DELETE", `/api/v1/shelves/${id}`),
  addToShelf: (shelfId: string, bookId: string) =>
    send<Book>("POST", `/api/v1/shelves/${shelfId}/books/${bookId}`),
  removeFromShelf: (shelfId: string, bookId: string) =>
    send<Book>("DELETE", `/api/v1/shelves/${shelfId}/books/${bookId}`),
  highlights: (bookId?: string) =>
    get<{ content: Highlight[]; totalElements: number }>(
      `/api/v1/highlights${bookId ? `?bookId=${bookId}` : ""}`,
    ),
  bookmarks: (bookId?: string) =>
    get<{ content: Bookmark[]; totalElements: number }>(
      `/api/v1/bookmarks${bookId ? `?bookId=${bookId}` : ""}`,
    ),

  // smart shelves (dynamic, rule-based)
  smartShelves: () =>
    get<{ content: SmartShelf[]; totalElements: number }>(`/api/v1/smart-shelves`),
  createSmartShelf: (name: string, rules: SmartRules) =>
    send<SmartShelf>("POST", `/api/v1/smart-shelves`, { name, rules }),
  deleteSmartShelf: (id: string) => send<null>("DELETE", `/api/v1/smart-shelves/${id}`),
  smartShelfBooks: (id: string, q: { page?: number; size?: number } = {}) => {
    const sp = new URLSearchParams();
    if (q.page != null) sp.set("page", String(q.page));
    if (q.size != null) sp.set("size", String(q.size));
    const qs = sp.toString();
    return get<Page<Book>>(`/api/v1/smart-shelves/${id}/books${qs ? `?${qs}` : ""}`);
  },

  // reader preferences (per-user; synced across devices)
  preferences: () => get<Record<string, unknown>>(`/api/v1/preferences`),
  putPreferences: (prefs: Record<string, unknown>) =>
    send<Record<string, unknown>>("PUT", `/api/v1/preferences`, prefs),

  // file URL for the reader (epub.js loads this directly)
  bookFileUrl: (id: string) => `${BASE}/api/v1/books/${id}/file`,

  // devices management
  devices: () => get<{ content: { id: string; name: string; created: string }[]; totalElements: number }>(`/api/v1/devices`),
  deleteDevice: (id: string) => send<null>("DELETE", `/api/v1/devices/${id}`),

  // device pairing (web side): create token + poll status
  createPairing: () =>
    send<{ token: string; expires: string; qr: { url: string; t: string } }>("POST", `/api/v1/auth/pair`),
  pairingStatus: (token: string) =>
    get<{ status: string; deviceName: string }>(`/api/v1/auth/pair/status?token=${encodeURIComponent(token)}`),

  // upload an EPUB (multipart) — backend parses metadata + cover
  uploadBook: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BASE}/api/v1/books`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  // writes
  putProgression: (id: string, p: Partial<ReadProgress>) =>
    send<ReadProgress>("PUT", `/api/v1/books/${id}/progression`, p),
  markRead: (id: string, completed: boolean) =>
    send<ReadProgress>("PATCH", `/api/v1/books/${id}/read-progress`, { completed }),
  setRating: (id: string, rating: number) =>
    send<Book>("PATCH", `/api/v1/books/${id}/rating`, { rating }),
  setArchived: (id: string, archived: boolean) =>
    send<Book>("PATCH", `/api/v1/books/${id}/archived`, { archived }),
  createHighlight: (h: {
    bookId: string; text: string; color?: string; note?: string | null; locator: Locator;
  }) => send<Highlight>("POST", `/api/v1/highlights`, h),
  updateHighlight: (id: string, patch: { note?: string | null; color?: string }) =>
    send<Highlight>("PATCH", `/api/v1/highlights/${id}`, patch),
  deleteHighlight: (id: string) => send<null>("DELETE", `/api/v1/highlights/${id}`),
  createBookmark: (b: { bookId: string; label: string; locator: Locator }) =>
    send<Bookmark>("POST", `/api/v1/bookmarks`, b),
  deleteBookmark: (id: string) => send<null>("DELETE", `/api/v1/bookmarks/${id}`),
};
