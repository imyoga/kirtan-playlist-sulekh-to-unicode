import { state } from './state.js';
import { updatePlaylistTitle } from './api.js';
import { showToast } from './toast.js';

export function setPlaylistTitleDisplay(title) {
  const titleEl = document.getElementById('display-title');
  if (titleEl) titleEl.textContent = title || 'Kirtan Playlist';
  document.title = `${title || 'Kirtan Playlist'} — Kirtan Playlist`;
}

export function makeTitleEditable() {
  const titleEl = document.getElementById('display-title');
  if (!titleEl || titleEl.contentEditable === 'true') return;

  const originalTitle =
    state.playlist?.title || titleEl.textContent.trim() || 'Kirtan Playlist';
  titleEl.contentEditable = 'true';
  titleEl.focus();

  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(titleEl);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    /* ignore */
  }

  let finished = false;

  const cleanup = () => {
    titleEl.removeEventListener('keydown', onKeydown);
    titleEl.removeEventListener('blur', onBlur);
    titleEl.removeEventListener('paste', onPaste);
  };

  const finish = (save) => {
    if (finished) return;
    finished = true;
    titleEl.contentEditable = 'false';
    cleanup();
    if (!save) {
      titleEl.textContent = originalTitle;
      return;
    }
    const newTitle = titleEl.textContent.trim();
    if (!newTitle || newTitle === originalTitle) {
      titleEl.textContent = originalTitle;
      return;
    }
    titleEl.textContent = newTitle;
    setPlaylistTitleDisplay(newTitle);
    if (state.playlist) state.playlist.title = newTitle;
    updatePlaylistTitle(state.slug, newTitle).catch(() => {
      showToast('Failed to update title', 'danger');
      titleEl.textContent = originalTitle;
      setPlaylistTitleDisplay(originalTitle);
      if (state.playlist) state.playlist.title = originalTitle;
    });
  };

  const onKeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finish(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finish(false);
    }
  };

  const onBlur = () => finish(true);

  const onPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text.replace(/[\r\n]+/g, ' '));
  };

  titleEl.addEventListener('keydown', onKeydown);
  titleEl.addEventListener('blur', onBlur);
  titleEl.addEventListener('paste', onPaste);
}
