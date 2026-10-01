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
  await migrateLegacySchema();
  await ensureDefaultGroupsForPlaylists();
  await ensurePlaylistTitleColumn();
  await ensureItemGroupIdIndex();
  return pool;
}

async function ensurePlaylistTitleColumn() {
  if (!(await columnExists('playlists', 'title'))) {
    await query(
      `ALTER TABLE playlists ADD COLUMN title TEXT NOT NULL DEFAULT 'Kirtan Playlist'`
    );
  }
  if (!(await columnExists('playlists', 'updated_at'))) {
    await query(
      `ALTER TABLE playlists ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
    );
  }
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
      title TEXT NOT NULL DEFAULT 'Kirtan Playlist',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_groups_playlist_id ON groups(playlist_id);`);
}

async function ensureItemGroupIdIndex() {
  if (await columnExists('items', 'group_id')) {
    await query(`CREATE INDEX IF NOT EXISTS idx_items_group_id ON items(group_id);`);
  }
}

async function columnExists(table, column) {
  const rows = await query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function migrateLegacySchema() {
  if (!(await columnExists('items', 'playlist_id'))) {
    return;
  }

  if (!(await columnExists('items', 'group_id'))) {
    await query(`ALTER TABLE items ADD COLUMN group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE`);
  }

  const playlists = await query(`SELECT id FROM playlists`);
  for (const playlist of playlists) {
    let groupRows = await query(
      `SELECT id FROM groups WHERE playlist_id = ? ORDER BY position ASC LIMIT 1`,
      [playlist.id]
    );
    if (!groupRows.length) {
      groupRows = await query(
        `INSERT INTO groups (playlist_id, name, position) VALUES (?, ?, 0) RETURNING id`,
        [playlist.id, 'Kirtan']
      );
    }
    const groupId = groupRows[0].id;
    await query(`UPDATE items SET group_id = ? WHERE playlist_id = ?`, [groupId, playlist.id]);
  }

  await query(`ALTER TABLE items DROP COLUMN IF EXISTS playlist_id`);
  await query(`ALTER TABLE items ALTER COLUMN group_id SET NOT NULL`);
}

async function ensureDefaultGroupsForPlaylists() {
  const playlists = await query(`SELECT id FROM playlists`);
  for (const playlist of playlists) {
    const existing = await query(`SELECT id FROM groups WHERE playlist_id = ? LIMIT 1`, [
      playlist.id,
    ]);
    if (!existing.length) {
      await query(`INSERT INTO groups (playlist_id, name, position) VALUES (?, ?, 0)`, [
        playlist.id,
        'Kirtan',
      ]);
    }
  }
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
}

export async function createPlaylist(title = 'Kirtan Playlist') {
  const safeTitle = (title || 'Kirtan Playlist').trim() || 'Kirtan Playlist';
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug(8);
    try {
      const rows = await query(
        `INSERT INTO playlists (slug, title) VALUES (?, ?) RETURNING id, slug, title, created_at, updated_at`,
        [slug, safeTitle]
      );
      const playlist = rows[0];
      await query(
        `INSERT INTO groups (playlist_id, name, position) VALUES (?, ?, 0)`,
        [playlist.id, 'Kirtan']
      );
      return playlist;
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }
  throw new Error('Failed to generate unique slug');
}

async function getPlaylistIdBySlug(slug) {
  const rows = await query(`SELECT id FROM playlists WHERE slug = ?`, [slug]);
  return rows[0]?.id ?? null;
}

export async function getPlaylistBySlug(slug) {
  const playlists = await query(
    `SELECT id, slug, title, created_at, updated_at FROM playlists WHERE slug = ?`,
    [slug]
  );
  if (!playlists.length) return null;
  const playlist = playlists[0];

  const groupRows = await query(
    `SELECT id, name, position, created_at, updated_at FROM groups WHERE playlist_id = ? ORDER BY position ASC, id ASC`,
    [playlist.id]
  );

  const groupIds = groupRows.map((g) => g.id);
  let itemRows = [];
  if (groupIds.length) {
    const placeholders = groupIds.map(() => '?').join(', ');
    itemRows = await query(
      `SELECT id, group_id, text, position, created_at, updated_at FROM items WHERE group_id IN (${placeholders}) ORDER BY position ASC, id ASC`,
      groupIds
    );
  }

  const itemsByGroup = {};
  for (const item of itemRows) {
    if (!itemsByGroup[item.group_id]) itemsByGroup[item.group_id] = [];
    itemsByGroup[item.group_id].push(item);
  }

  const groups = groupRows.map((group) => ({
    ...group,
    items: itemsByGroup[group.id] || [],
  }));

  return { ...playlist, groups };
}

export async function updatePlaylistTitle(slug, title) {
  const safeTitle = (title || '').trim();
  if (!safeTitle) return null;
  const rows = await query(
    `UPDATE playlists SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ? RETURNING id, slug, title, created_at, updated_at`,
    [safeTitle, slug]
  );
  return rows[0] || null;
}

export async function createGroup(slug, name) {
  const playlistId = await getPlaylistIdBySlug(slug);
  if (!playlistId) return null;
  const posRows = await query(
    `SELECT COALESCE(MAX(position), -1) AS max_pos FROM groups WHERE playlist_id = ?`,
    [playlistId]
  );
  const position = Number(posRows[0].max_pos) + 1;
  const rows = await query(
    `INSERT INTO groups (playlist_id, name, position) VALUES (?, ?, ?) RETURNING id, name, position, created_at, updated_at`,
    [playlistId, name, position]
  );
  return { ...rows[0], items: [], slug };
}

export async function getPlaylistSlugByGroupId(groupId) {
  const rows = await query(
    `SELECT p.slug
     FROM groups g
     JOIN playlists p ON p.id = g.playlist_id
     WHERE g.id = ?`,
    [groupId]
  );
  return rows[0]?.slug ?? null;
}

export async function getPlaylistSlugByItemId(itemId) {
  const rows = await query(
    `SELECT p.slug
     FROM items i
     JOIN groups g ON g.id = i.group_id
     JOIN playlists p ON p.id = g.playlist_id
     WHERE i.id = ?`,
    [itemId]
  );
  return rows[0]?.slug ?? null;
}

export async function updateGroupName(groupId, name) {
  const slug = await getPlaylistSlugByGroupId(groupId);
  const rows = await query(
    `UPDATE groups SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, name, position, created_at, updated_at`,
    [name, groupId]
  );
  if (!rows[0]) return null;
  return { ...rows[0], slug };
}

export async function deleteGroup(groupId) {
  const rows = await query(`DELETE FROM groups WHERE id = ? RETURNING id`, [groupId]);
  return rows.length > 0;
}

export async function updateGroupPositions(slug, groupIds) {
  const playlistId = await getPlaylistIdBySlug(slug);
  if (!playlistId) return false;
  for (let i = 0; i < groupIds.length; i++) {
    await query(
      `UPDATE groups SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND playlist_id = ?`,
      [i, groupIds[i], playlistId]
    );
  }
  return true;
}

async function getGroupWithPlaylist(groupId) {
  const rows = await query(
    `SELECT g.*, p.slug AS playlist_slug, p.id AS playlist_id
     FROM groups g
     JOIN playlists p ON p.id = g.playlist_id
     WHERE g.id = ?`,
    [groupId]
  );
  return rows[0] || null;
}

export async function createItemInGroup(groupId, text, position) {
  const rows = await query(
    `INSERT INTO items (group_id, text, position) VALUES (?, ?, ?) RETURNING id, group_id, text, position, created_at, updated_at`,
    [groupId, text, position]
  );
  return rows[0];
}

export async function getNextItemPositionInGroup(groupId) {
  const rows = await query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM items WHERE group_id = ?`,
    [groupId]
  );
  return Number(rows[0].next_pos) || 0;
}

export async function getDefaultGroupId(slug) {
  const playlistId = await getPlaylistIdBySlug(slug);
  if (!playlistId) return null;
  const rows = await query(
    `SELECT id FROM groups WHERE playlist_id = ? ORDER BY position ASC, id ASC LIMIT 1`,
    [playlistId]
  );
  return rows[0]?.id ?? null;
}

export async function updateItemText(itemId, text) {
  const slug = await getPlaylistSlugByItemId(itemId);
  const rows = await query(
    `UPDATE items SET text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, group_id, text, position, created_at, updated_at`,
    [text, itemId]
  );
  if (!rows[0]) return null;
  return { ...rows[0], slug };
}

export async function deleteItem(itemId) {
  const rows = await query(`DELETE FROM items WHERE id = ? RETURNING id`, [itemId]);
  return rows.length > 0;
}

export async function updateItemPositionsInGroup(groupId, itemIds) {
  const group = await getGroupWithPlaylist(groupId);
  if (!group) return null;

  for (let i = 0; i < itemIds.length; i++) {
    await query(
      `UPDATE items SET position = ?, group_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND group_id IN (SELECT id FROM groups WHERE playlist_id = ?)`,
      [i, groupId, itemIds[i], group.playlist_id]
    );
  }
  return { ok: true, slug: group.playlist_slug };
}
