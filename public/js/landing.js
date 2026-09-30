const form = document.getElementById('create-playlist-form');
const btn = document.getElementById('create-playlist-btn');
const titleInput = document.getElementById('playlist-title-input');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btn) btn.disabled = true;
  const title = titleInput?.value?.trim() || 'Kirtan Playlist';
  try {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed');
    const { slug } = await res.json();
    window.location.href = `/p/${slug}`;
  } catch {
    if (btn) btn.disabled = false;
    const { showToast } = await import('./toast.js');
    showToast('Could not create playlist', 'danger');
  }
});

titleInput?.focus();
