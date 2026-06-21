<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# my-sensein-book-frontend (handoff for AI agents)

Web **PWA** for **My.Sensein.Book** (dev: Kravitz Geroge). A **1:1 caliBlur clone of
Calibre-Web-Automated's UI** (method: VPT — Verbatim Parity Transcription), rebranded,
data from our Go backend. Next.js 16 + React 19 + TS + Tailwind 4 (App Router) + epub.js.

## ⚠️ Hard rules
- **Build/run ONLY in Docker** (project rule) — no Node on the host:
  ```bash
  docker run -d --name web-dev -v "$PWD":/work -w /work -p 3000:3000 \
    -e NEXT_PUBLIC_API_BASE=http://localhost:8090 \
    node:22-alpine sh -c "npm run dev -- -H 0.0.0.0 -p 3000"
  ```
- Next 16 specifics: route handler `params` is a Promise (`await params`); `useSearchParams`
  needs a Suspense boundary above it (layout provides one — avoid a second nested one,
  it can hang on its fallback).
- epub.js: load the book as an **ArrayBuffer** (`ePub(await fetch(url).then(r=>r.arrayBuffer()))`),
  not a URL (a non-`.epub` URL → 404 on container.xml). Force reader text color with
  `!important` (book CSS can make dark-on-dark text invisible).

## Architecture
- **Contract = `src/lib/types.ts`** (Komga-style REST + CWA data model) — the source of
  truth the Go backend implements. Client: `src/lib/api.ts`.
- **Data source switch**: browser calls the backend at `NEXT_PUBLIC_API_BASE` (e.g.
  http://localhost:8090). Empty = same-origin BFF (`src/app/api/v1/*` mock, OR a CWA
  adapter via `src/lib/cwa.ts` when `CWA_BASE` set — adapter is optional/legacy).
- **CWA is a UI reference only** — its backend is NOT our data source.
- UI: `src/components/cwa/*` (AppChrome, TopBar, SideNav drawer, BookCard, BooksTable,
  SortToolbar, Icon). caliBlur tokens in `globals.css` (accent #cc7b19, gold #f9be03).
  Responsive (sidebar→drawer <lg), PWA manifest + icons.

## Done
Library (sorts×8, search, shelf/facet filters, context heading, grid + Books-List table),
detail (rating stars, archive, shelves, mark-read, read, download), light epub.js reader
(highlights/bookmarks/progress), EPUB upload, shelves CRUD, faceted `/browse/[type]`,
Advanced Search, **QR device pairing `/pair`**, avatar menu, responsive + PWA, animations.

## Knowledge transfer (outside repos, keep current)
- `~/Documents/doc-vpt/journals/vpt-journal.json` — per-screen caliBlur transcription.
- `~/Documents/doc-vpt/journals/qa-journal.json` — QA tests (status/datetime/result);
  **run regularly, add missing tests, update results.**
- Browser verify via Claude-in-Chrome (DOM/JS eval reliable; screenshot/console may
  degrade — reconnect the extension if so).

## Related
- Backend: github.com/gicravets/my-sensein-book-backend
- iOS: github.com/gicravets/my-sensein-book-ios
