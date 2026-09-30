import Sortable from '../vendor/sortable.esm.js';
import {
  getMainOrderedIds,
  reorderNavList,
  persistOrder,
  runOrderSync,
  refreshItemNumbers,
} from './order-sync.js';

let sortableMain = null;

export function initSortable(listEl, navListEl) {
  if (!listEl || sortableMain) return;
  sortableMain = Sortable.create(listEl, {
    animation: 180,
    handle: '.drag-handle',
    draggable: '.item-card:not(.is-draft)',
    ghostClass: 'sortable-ghost',
    onEnd() {
      const ids = getMainOrderedIds(listEl);
      runOrderSync(() => {
        if (navListEl) reorderNavList(navListEl, ids, { animate: true });
        refreshItemNumbers(listEl, navListEl);
        persistOrder(ids);
      });
    },
  });
}
