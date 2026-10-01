let activeTimer = null;

/**
 * Shows an animated moving dotted border around the viewport for the given duration (default: 1000ms).
 * @param {number} durationMs - Duration in milliseconds to show the border
 */
export function flashViewportSyncBorder(durationMs = 1000) {
  const el = document.getElementById('viewport-sync-border');
  if (!el) return;

  el.classList.add('active');

  if (activeTimer) {
    clearTimeout(activeTimer);
  }

  activeTimer = setTimeout(() => {
    el.classList.remove('active');
    activeTimer = null;
  }, durationMs);
}
