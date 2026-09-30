import { state } from './state.js';
import { copyUrlToClipboard } from './toast.js';

export async function handleShare() {
  const title = state.playlist?.title || 'Kirtan Playlist';
  const url = window.location.href;
  const shareData = {
    title,
    text: `Kirtan playlist: "${title}"`,
    url,
  };

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyUrlToClipboard(url);
      }
      return;
    }
  }
  copyUrlToClipboard(url);
}
