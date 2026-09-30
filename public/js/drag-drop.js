import Sortable from '../vendor/sortable.esm.js';
import {
  persistAllGroupPositions,
  runOrderSync,
  refreshItemNumbers,
} from './order-sync.js';
import { rebuildSidebarNav } from './sidebar.js';

let groupsSortable = null;

export function setupItemsListSortable(itemsListEl, groupId) {
  if (!itemsListEl) return null;
  if (itemsListEl._sortable) {
    itemsListEl._sortable.destroy();
  }

  const sortable = Sortable.create(itemsListEl, {
    group: { name: 'kirtan-items', pull: true, put: true },
    handle: '.drag-handle',
    draggable: '.item-card:not(.is-draft)',
    animation: 180,
    ghostClass: 'sortable-ghost',
    onEnd(evt) {
      const fromGroupId = evt.from.closest('.group-card')?.dataset.groupId;
      const toGroupId = evt.to.closest('.group-card')?.dataset.groupId;
      const navListEl = document.getElementById('nav-list');

      runOrderSync(() => {
        rebuildSidebarNav();
        refreshItemNumbers(document.getElementById('nav-list'));
        if (fromGroupId && toGroupId && fromGroupId !== toGroupId) {
          evt.item.dataset.groupId = toGroupId;
        }
        persistAllGroupPositions();
      });
    },
  });

  itemsListEl._sortable = sortable;
  return sortable;
}

export function initGroupsSortable(containerEl) {
  if (!containerEl || groupsSortable) return;
  groupsSortable = Sortable.create(containerEl, {
    animation: 200,
    handle: '.group-header .drag-handle',
    draggable: '.group-card',
    ghostClass: 'group-sortable-ghost',
    onEnd() {
      persistAllGroupPositions();
      const navListEl = document.getElementById('nav-list');
      refreshItemNumbers(navListEl);
    },
  });
}
