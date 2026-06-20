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
  sort?: SortKey;
  page?: number;
  size?: number;
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

  // file URL for the reader (epub.js loads this directly)
  bookFileUrl: (id: string) => `${BASE}/api/v1/books/${id}/file`,

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
