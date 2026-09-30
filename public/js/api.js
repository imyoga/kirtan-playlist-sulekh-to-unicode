export function getSlug() {
  return document.body.dataset.slug || '';
}

export async function updatePlaylistTitle(slug, title) {
  const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to update title');
  return res.json();
}

export async function fetchPlaylist(slug) {
  const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

export async function createGroup(slug, name) {
  const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function renameGroup(groupId, name) {
  const res = await fetch(`/api/groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename');
  return res.json();
}

export async function deleteGroupApi(groupId) {
  const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
}

export async function createItem(slug, text, groupId) {
  const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, groupId }),
  });
  if (!res.ok) throw new Error('Failed to add');
  return res.json();
}

export async function updateItem(id, text) {
  const res = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to save');
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
}

export async function fetchSulekh(text) {
  const res = await fetch('/api/convert/to-sulekh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Convert failed');
  const data = await res.json();
  return data.text;
}
