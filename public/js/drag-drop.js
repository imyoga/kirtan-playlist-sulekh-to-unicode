import Sortable from '../vendor/sortable.esm.js';
import { savePositions, getSlug } from './api.js';
import { showToast } from './toast.js';

let sortable = null;

export function initSortable(listEl) {
  if (!listEl || sortable) return;
  sortable = Sortable.create(listEl, {
    animation: 150,
    handle: '.drag-handle',
    draggable: '.item-card:not(.is-draft)',
    ghostClass: 'sortable-ghost',
    onEnd() {
      const slug = getSlug();
      const ids = [...listEl.querySelectorAll('.item-card[data-item-id]')].map((el) =>
        Number(el.dataset.itemId)
      );
      savePositions(slug, ids).catch(() => showToast('Failed to save order', 'danger'));
    },
  });
}
