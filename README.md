# Kirtan Playlist (Unicode)

A minimal, login-free web app for building shareable playlists of religious song lyrics in **Gujarati Unicode**. Paste lyrics in **Sulekh** or **Unicode**; the server stores Unicode and can produce Sulekh on demand for copying.

Each playlist lives at a unique URL (`/p/:slug`). Kirtans are organized in **named groups** and labeled **`group.item`** (e.g. `1.1`, `2.3`) so order stays clear when you split a setlist into sections. No accounts, no permissions—anyone with the link can view and edit.

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

- **Create playlist** — optional name field (defaults to “Kirtan Playlist”); creates a new playlist and redirects to `/p/:slug`.

### Playlist page (`/p/:slug`)

- **Playlist name** — click the title (or pencil) to rename; saved to the server. Used in the browser tab and in **Open Graph / Twitter** tags when someone opens the link in WhatsApp, etc.
- **Share** — uses the Web Share API when available; otherwise copies the playlist URL to the clipboard.
- **Groups** — like the checklist app: kirtans live inside named groups. **+ Group** adds a section; drag the group header to reorder groups. Each group has **+** to add a kirtan, click the name to rename, trash to delete (at least one group must remain). Kirtans can be dragged **between groups**; order is saved automatically.
- **Contents sidebar** — **grouped like the main page**: each group has a heading and its kirtans listed underneath. Each kirtan is labeled **`group.item`** (e.g. `1.1`, `1.2`, `2.1`) so numbers stay meaningful within sections; the sidebar header shows the **total kirtan count** (not the label scheme). Click a title to scroll to that lyric. Drag titles in the sidebar to reorder; the main list follows with a short highlight animation (and vice versa when dragging cards). Labels update after reorder, add, delete, or group moves. On **desktop (≥960px)** the sidebar stays open; on **mobile**, use the **hamburger** button to open/close it (backdrop tap closes).
- **Add item (+)** — group **+** or the page **+** opens a draft card with a textarea. The draft shows the **next `group.item` label** it will receive after you confirm (new kirtans are appended in that group). On an **empty playlist**, the first group’s draft opens automatically with the textarea focused. Paste Sulekh or Unicode, then confirm with the check button or **Enter** (use **Shift+Enter** for a new line in the draft).
- **Sulekh input** — on add, text is converted to Unicode on the server; a toast confirms conversion.
- **Unicode input** — stored as-is (no conversion toast). Sulekh is generated when you use **Copy Sulekh**.
- **Item card**
  - **Number** — `group.item` label (first number = group order, second = item order within that group), kept in sync with the sidebar.
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
| `POST` | `/playlists` | Body optional `{ "title": "..." }` (default `Kirtan Playlist`). Returns `{ id, slug, title, ... }`. |
| `GET` | `/playlists/:slug` | Get playlist with `title` and ordered `groups[]`, each with nested `items[]`. 404 if missing. |
| `PATCH` | `/playlists/:slug` | Body `{ "title": "..." }`. Rename playlist (used for share previews after reload). |

### Groups

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/playlists/:slug/groups` | Body: `{ "name": "..." }`. Create group. |
| `PUT` | `/playlists/:slug/groups/positions` | Body: `{ "groupIds": [1, 2] }`. Reorder groups. |
| `PATCH` | `/groups/:id` | Body: `{ "name": "..." }`. Rename group. |
| `DELETE` | `/groups/:id` | Delete group and its items. `204` on success. |

### Items

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/playlists/:slug/items` | Body: `{ "text": "...", "groupId": 1 }` (`groupId` optional; defaults to first group). Detects Sulekh vs Unicode, converts if needed. Returns `{ item, converted }`. |
| `PATCH` | `/items/:id` | Body: `{ "text": "..." }`. Update stored Unicode text. |
| `DELETE` | `/items/:id` | Delete item. `204` on success. |
| `PUT` | `/groups/:id/items/positions` | Body: `{ "itemIds": [1, 2, 3] }`. Reorder items within a group (also used when moving items across groups). |

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

- **playlists** — `id`, `slug` (8-char URL-safe), `title`, `created_at`, `updated_at`
- **groups** — `id`, `playlist_id`, `name`, `position`, timestamps
- **items** — `id`, `group_id`, `text` (Unicode), `position`, timestamps

New playlists get a default group named **Kirtan**. Existing data is migrated automatically on server start.

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
