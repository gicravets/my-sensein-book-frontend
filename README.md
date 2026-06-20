# my-sensein-book-frontend

Веб-PWA для библиотеки и чтения книг (часть проекта **my-sensein-book**). Цель — функциональный аналог Calibre-Web-Automated в современном виде: каталог, полки, прогресс чтения, закладки и выделения с заметками, встроенная читалка.

## Стек

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **epub.js** — встроенная читалка EPUB
- PWA (web manifest, standalone)

## Архитектура

Фронт построен против **мок-API** на роутах Next (`src/app/api/v1/*`). Контракт этого API зафиксирован в [`src/lib/types.ts`](src/lib/types.ts) и является контрактом для бэкенда [`my-sensein-book-backend`](https://github.com/gicravets/my-sensein-book-backend) (форма API в стиле Komga + модель данных в стиле CWA).

Переключение с мока на реальный бэкенд — через переменную окружения:

```bash
NEXT_PUBLIC_API_BASE=https://api.example.com
```

## Экраны

- **Библиотека** — грид с обложками, поиск, сортировка, фильтр по полкам, прогресс.
- **Книга** — метаданные, «читать/продолжить», отметка «прочитано», закладки, выделения.
- **Читалка** (`/book/:id/read`) — пагинация, оглавление, тёмная тема, автосохранение прогресса, выделение текста → цветной хайлайт с reflow-safe CFI-локатором.
- **Полки**, **Выделения**, **Закладки**.

## Запуск (только Docker)

Сборка и dev-сервер запускаются в контейнере, на хост Node не ставится:

```bash
docker run -d --name web-dev \
  -v "$PWD":/work -w /work -p 3000:3000 \
  node:22-alpine sh -c "npm install && npm run dev -- -H 0.0.0.0 -p 3000"
```

Открыть http://localhost:3000

## Структура

```
src/
  app/            # страницы (App Router) + мок-API (app/api/v1)
  components/     # Cover, BookCard, Sidebar, HighlightCard, …
  lib/
    types.ts      # КОНТРАКТ API (источник истины для бэкенда)
    api.ts        # типизированный клиент
    mock-data.ts  # сид мок-данных
data/sample.epub  # тестовая книга для читалки (Project Gutenberg, public domain)
```
