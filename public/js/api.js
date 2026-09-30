export function getSlug() {
  return document.body.dataset.slug || '';
}

export async function fetchPlaylist(slug) {
  const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

export async function createItem(slug, text) {
  const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
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

export async function savePositions(slug, itemIds) {
  await fetch(`/api/playlists/${encodeURIComponent(slug)}/items/positions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds }),
  });
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
