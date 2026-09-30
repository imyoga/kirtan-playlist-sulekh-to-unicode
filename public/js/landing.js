const btn = document.getElementById('create-playlist-btn');
btn?.addEventListener('click', async () => {
  btn.disabled = true;
  try {
    const res = await fetch('/api/playlists', { method: 'POST' });
    if (!res.ok) throw new Error('Failed');
    const { slug } = await res.json();
    window.location.href = `/p/${slug}`;
  } catch {
    btn.disabled = false;
    const { showToast } = await import('./toast.js');
    showToast('Could not create playlist', 'danger');
  }
});
