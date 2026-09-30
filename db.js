import crypto from 'node:crypto';
import { Pool } from 'pg';

let pool = null;

function generateSlug(length = 8) {
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
  return bytes.toString('base64url').slice(0, length);
}

export async function initDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    max: 10,
  });
  const client = await pool.connect();
  client.release();
  await createTables();
  return pool;
}

async function query(sql, params = []) {
  let i = 1;
  const pgSql = sql.replace(/\?/g, () => `$${i++}`);
  const res = await pool.query(pgSql, params);
  return res.rows;
}

async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS playlists (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(32) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_items_playlist_id ON items(playlist_id);`);
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
}

export async function createPlaylist() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug(8);
    try {
      const rows = await query(
        `INSERT INTO playlists (slug) VALUES (?) RETURNING id, slug, created_at`,
        [slug]
      );
      return rows[0];
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }
  throw new Error('Failed to generate unique slug');
}

export async function getPlaylistBySlug(slug) {
  const playlists = await query(`SELECT id, slug, created_at FROM playlists WHERE slug = ?`, [
    slug,
  ]);
  if (!playlists.length) return null;
  const playlist = playlists[0];
  const items = await query(
    `SELECT id, text, position, created_at, updated_at FROM items WHERE playlist_id = ? ORDER BY position ASC, id ASC`,
    [playlist.id]
  );
  return { ...playlist, items };
}

export async function createItem(playlistSlug, text, position) {
  const playlists = await query(`SELECT id FROM playlists WHERE slug = ?`, [playlistSlug]);
  if (!playlists.length) return null;
  const playlistId = playlists[0].id;
  const rows = await query(
    `INSERT INTO items (playlist_id, text, position) VALUES (?, ?, ?) RETURNING id, text, position, created_at, updated_at`,
    [playlistId, text, position]
  );
  return rows[0];
}

export async function updateItemText(itemId, text) {
  const rows = await query(
    `UPDATE items SET text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, text, position, created_at, updated_at`,
    [text, itemId]
  );
  return rows[0] || null;
}

export async function deleteItem(itemId) {
  const rows = await query(`DELETE FROM items WHERE id = ? RETURNING id`, [itemId]);
  return rows.length > 0;
}

export async function updateItemPositions(playlistSlug, itemIds) {
  const playlists = await query(`SELECT id FROM playlists WHERE slug = ?`, [playlistSlug]);
  if (!playlists.length) return false;
  const playlistId = playlists[0].id;
  for (let i = 0; i < itemIds.length; i++) {
    await query(`UPDATE items SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND playlist_id = ?`, [
      i,
      itemIds[i],
      playlistId,
    ]);
  }
  return true;
}

export async function getNextItemPosition(playlistSlug) {
  const playlists = await query(`SELECT id FROM playlists WHERE slug = ?`, [playlistSlug]);
  if (!playlists.length) return 0;
  const rows = await query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM items WHERE playlist_id = ?`,
    [playlists[0].id]
  );
  return Number(rows[0].next_pos) || 0;
}
