// In-memory seed data for the mock API. Replaced by the Go backend later.
import type { Book, Shelf, Bookmark, Highlight } from "./types";

export const shelves: Shelf[] = [
  { id: "sh-fav", name: "Избранное", kind: "normal", bookCount: 0, isPublic: false },
  { id: "sh-classics", name: "Классика", kind: "normal", bookCount: 0, isPublic: true },
  { id: "sh-now", name: "Читаю сейчас", kind: "smart", bookCount: 0, isPublic: false },
  { id: "sh-toread", name: "В планах", kind: "normal", bookCount: 0, isPublic: false },
];

function mkBook(b: Partial<Book> & Pick<Book, "id" | "title" | "authors">): Book {
  return {
    series: null,
    seriesIndex: null,
    format: "EPUB",
    size: 1_200_000,
    language: "ru",
    publisher: null,
    isbn: null,
    description: null,
    tags: [],
    addedAt: "2026-06-10T10:00:00Z",
    coverSeed: b.title,
    coverUrl: null,
    readProgress: null,
    shelfIds: [],
    ...b,
  };
}

export const books: Book[] = [
  mkBook({
    id: "bk-1",
    title: "Pride and Prejudice",
    authors: ["Jane Austen"],
    language: "en",
    publisher: "Project Gutenberg",
    tags: ["classic", "romance"],
    description:
      "Один из самых известных романов Джейн Остин: ирония нравов, гордость и предубеждения.",
    shelfIds: ["sh-classics", "sh-now"],
    readProgress: {
      progression: 0.4, totalProgression: 0.07, page: 24, totalPages: 357,
      completed: false, lastReadAt: "2026-06-19T21:10:00Z", deviceName: "My.Sensein.Book iPhone",
    },
  }),
  mkBook({
    id: "bk-2",
    title: "Дубровский",
    authors: ["Александр Сергеевич Пушкин"],
    format: "FB2",
    tags: ["classic"],
    description: "Незаконченный роман А. С. Пушкина о благородном разбойнике.",
    shelfIds: ["sh-classics", "sh-fav"],
    readProgress: {
      progression: 0.68, totalProgression: 0.84, page: 96, totalPages: 114,
      completed: false, lastReadAt: "2026-06-19T20:30:00Z", deviceName: "My.Sensein.Book iPhone",
    },
  }),
  mkBook({
    id: "bk-3",
    title: "Война и мир. Том 1",
    authors: ["Лев Толстой"],
    series: "Война и мир",
    seriesIndex: 1,
    tags: ["classic", "epic"],
    shelfIds: ["sh-classics", "sh-toread"],
  }),
  mkBook({
    id: "bk-4",
    title: "Метро 2033",
    authors: ["Дмитрий Глуховский"],
    tags: ["sci-fi"],
    shelfIds: ["sh-toread"],
    readProgress: {
      progression: 1, totalProgression: 1, page: 540, totalPages: 540,
      completed: true, lastReadAt: "2026-05-30T18:00:00Z", deviceName: "iPad",
    },
  }),
  mkBook({
    id: "bk-5",
    title: "The Hobbit",
    authors: ["J.R.R. Tolkien"],
    language: "en",
    tags: ["fantasy"],
    shelfIds: ["sh-fav"],
  }),
  mkBook({
    id: "bk-6",
    title: "Преступление и наказание",
    authors: ["Фёдор Достоевский"],
    tags: ["classic"],
    shelfIds: ["sh-classics"],
    readProgress: {
      progression: 0.12, totalProgression: 0.22, page: 130, totalPages: 600,
      completed: false, lastReadAt: "2026-06-15T09:00:00Z", deviceName: "My.Sensein.Book iPhone",
    },
  }),
];

export const bookmarks: Bookmark[] = [
  {
    id: "bm-1", bookId: "bk-1",
    locator: { href: "OEBPS/Text/main3.xml", type: "xhtml", value: "ch3", progression: 0.4 },
    label: "Глава 3 — бал в Незерфилде", createdAt: "2026-06-18T12:00:00Z",
  },
  {
    id: "bm-2", bookId: "bk-2",
    locator: { href: "ch5", type: "fb2", value: "p120", progression: 0.68 },
    label: "Пожар в усадьбе", createdAt: "2026-06-17T19:00:00Z",
  },
];

export const highlights: Highlight[] = [
  {
    id: "hl-1", bookId: "bk-1", color: "yellow",
    text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
    note: "Знаменитая первая строка — задаёт иронический тон.",
    locator: { href: "OEBPS/Text/main1.xml", type: "xhtml", value: "p1", progression: 0.01 },
    createdAt: "2026-06-18T12:05:00Z",
  },
  {
    id: "hl-2", bookId: "bk-2", color: "green",
    text: "Кирила Петрович был с ним необыкновенно ласков.",
    note: null,
    locator: { href: "ch2", type: "fb2", value: "p40", progression: 0.2 },
    createdAt: "2026-06-17T18:30:00Z",
  },
  {
    id: "hl-3", bookId: "bk-6", color: "pink",
    text: "Тварь ли я дрожащая или право имею.",
    note: "Ключевой вопрос Раскольникова.",
    locator: { href: "part3", type: "xhtml", value: "p210", progression: 0.5 },
    createdAt: "2026-06-15T09:30:00Z",
  },
];

// keep shelf counts in sync with seed
for (const s of shelves) s.bookCount = books.filter((b) => b.shelfIds.includes(s.id)).length;
