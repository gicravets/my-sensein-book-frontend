// API contract types — shared by the mock API (app/api/*) and the client (lib/api.ts).
// Shape follows Komga's REST conventions; the data model borrows CWA's richer
// reading-history entities (shelves, bookmarks, highlights with note/color).
// This file IS the contract the future Go backend must satisfy.

export type BookFormat = "EPUB" | "FB2" | "PDF";

export interface ReadProgress {
  /** Readium-style locator progression within the current resource (0..1). */
  progression: number;
  /** Overall progression across the whole book (0..1). */
  totalProgression: number;
  page: number;
  totalPages: number;
  completed: boolean;
  lastReadAt: string | null;
  deviceName: string | null;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  series: string | null;
  seriesIndex: number | null;
  format: BookFormat;
  /** bytes */
  size: number;
  language: string | null;
  publisher: string | null;
  isbn: string | null;
  description: string | null;
  tags: string[];
  addedAt: string;
  /** Seed for a deterministic gradient cover; real backend returns coverUrl. */
  coverSeed: string;
  coverUrl: string | null;
  readProgress: ReadProgress | null;
  shelfIds: string[];
  /** 0–5 user rating (0 = unrated). */
  rating: number;
  archived: boolean;
}

export interface Shelf {
  id: string;
  name: string;
  kind: "normal" | "smart";
  bookCount: number;
  isPublic: boolean;
}

/** Flexible locator (CWA kobo_bookmark style): reflow-safe across devices. */
export interface Locator {
  href: string | null;
  type: string | null;
  value: string | null;
  progression: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  locator: Locator;
  label: string;
  createdAt: string;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "orange";

export interface Highlight {
  id: string;
  bookId: string;
  text: string;
  color: HighlightColor;
  note: string | null;
  locator: Locator;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

export interface SessionUser {
  id: string;
  email: string;
  roles: string[];
}
