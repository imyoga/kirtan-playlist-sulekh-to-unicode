# Kirtan Playlist (Unicode)

A minimal, login-free web app for building shareable playlists of religious song lyrics in **Gujarati Unicode**. Paste lyrics in **Sulekh** or **Unicode**; the server stores Unicode and can produce Sulekh on demand for copying.

Each playlist lives at a unique URL (`/p/:slug`). No accounts, no permissions—anyone with the link can view and edit.

## Stack

| Layer | Technology |
|--------|------------|
| Server | Node.js (ESM), Express |
| Database | PostgreSQL 16 (Docker Compose) |
| Frontend | Vanilla HTML, CSS, JavaScript (modular files under `public/`) |
| Drag-and-drop | [SortableJS](https://sortablejs.github.io/Sortable/) (vendored) |
| Package manager | pnpm |

Conversion logic is ported from the proven reference in [`ref/ui-based-converter/sulekh_to_unicode_7.html`](ref/ui-based-converter/sulekh_to_unicode_7.html). Character maps are generated into `src/converter/maps/` via `pnpm extract-maps`.

## Quick start

**Prerequisites:** Node.js 20+, pnpm, Docker (for Postgres).

```bash
pnpm install
cp .env.example .env
pnpm db:up          # Postgres on localhost:5434
pnpm dev            # http://localhost:3001
```

Production:

```bash
pnpm start
```

Run tests:

```bash
pnpm test
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `3001`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `BASE_URL` | Optional public base URL for Open Graph meta tags |

See [`.env.example`](.env.example). Do not commit `.env`.

## UI features

### Home (`/`)

- **Create playlist** — creates a new playlist and redirects to `/p/:slug`.

### Playlist page (`/p/:slug`)

- **Contents sidebar** — lists each item’s title (first line, truncated) with a **1-based index**; the header shows the **total kirtan count**. Click a title to scroll to that lyric. Drag titles in the sidebar to reorder; the main list follows with a short highlight animation (and vice versa when dragging cards). Numbers update after reorder, add, or delete. On **desktop (≥960px)** the sidebar stays open; on **mobile**, use the **hamburger** button to open/close it (backdrop tap closes).
- **Add item (+)** — opens a draft card with a textarea. Paste Sulekh or Unicode, then confirm with the check button or **Enter** (use **Shift+Enter** for a new line in the draft).
- **Sulekh input** — on add, text is converted to Unicode on the server; a toast confirms conversion.
- **Unicode input** — stored as-is (no conversion toast). Sulekh is generated when you use **Copy Sulekh**.
- **Item card**
  - **Number** — position in the playlist (1, 2, 3…), kept in sync with the sidebar.
  - **Title** — first non-empty line of the lyric, up to ~7 words with ellipsis.
  - **Editable Unicode text** — 16px Noto Sans Gujarati; textarea grows with content (no inner scrollbar).
  - **Drag handle** — reorder items; order is saved automatically.
  - **Copy Unicode** / **Copy Sulekh** — clipboard + toast.
  - **Delete** — removes the item.
- Edits to existing items **autosave** (debounced) to the server.

Styling is intentionally minimal: light background, simple cards, no login UI.

## HTTP API

Base path: `/api`. JSON request/response bodies unless noted.

### Playlists

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/playlists` | Create playlist. Returns `{ id, slug, created_at }`. |
| `GET` | `/playlists/:slug` | Get playlist and ordered `items[]` (`id`, `text`, `position`, timestamps). 404 if missing. |

### Items

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/playlists/:slug/items` | Body: `{ "text": "..." }`. Detects Sulekh vs Unicode, converts if needed, appends item. Returns `{ item, converted }` where `converted` is `true` when Sulekh was converted to Unicode. |
| `PATCH` | `/items/:id` | Body: `{ "text": "..." }`. Update stored Unicode text. |
| `DELETE` | `/items/:id` | Delete item. `204` on success. |
| `PUT` | `/playlists/:slug/items/positions` | Body: `{ "itemIds": [1, 2, 3] }`. Persist order after drag-and-drop. |

### Conversion (utilities)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/convert/to-unicode` | Body: `{ "text": "..." }`. Returns `{ "text": "..." }` (Sulekh → Unicode). |
| `POST` | `/convert/to-sulekh` | Body: `{ "text": "..." }`. Returns `{ "text": "..." }` (Unicode → Sulekh). |

### Pages (HTML)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Landing page. |
| `GET` | `/p/:slug` | Playlist UI (404 page if slug unknown). |

Static assets are served from `public/`.

## Data model

- **playlists** — `id`, `slug` (8-char URL-safe), `created_at`
- **items** — `id`, `playlist_id`, `text` (Unicode), `position`, `created_at`, `updated_at`

Only **Unicode** is persisted. Sulekh is derived at read/copy time via the reverse converter.

## Project layout

```
server.js              # Entry point
db.js                  # PostgreSQL access
docker-compose.yml     # Local Postgres (port 5434)
public/                # Static UI (css/, js/, vendor/)
src/
  app.js               # Express app
  routes/              # Page + API routes
  controllers/
  services/
  converter/           # Sulekh ↔ Unicode + detect
  middleware/
  utils/
scripts/
  extract-maps.js      # Regenerate maps from ref HTML
ref/                   # Reference converter & sample texts
tests/
```

## Regenerating conversion maps

If `ref/ui-based-converter/sulekh_to_unicode_7.html` is updated:

```bash
pnpm extract-maps
```

Commit the updated files under `src/converter/maps/`.

## License

ISC
