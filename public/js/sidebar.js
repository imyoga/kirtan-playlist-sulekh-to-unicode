import Sortable from '../vendor/sortable.esm.js';
import { itemTitleFromText } from './title.js';
import {
  getMainOrderedIds,
  reorderMainList,
  reorderNavList,
  persistOrder,
  runOrderSync,
  isOrderSyncing,
  refreshItemNumbers,
} from './order-sync.js';

const DESKTOP_MQ = '(min-width: 960px)';

let navListEl = null;
let mainListEl = null;
let sortableNav = null;

export function createNavItem(item) {
  const li = document.createElement('li');
  li.className = 'nav-item';
  li.dataset.navItemId = String(item.id);
  const title = itemTitleFromText(item.text || '');
  li.innerHTML = `
    <button type="button" class="nav-drag" aria-label="Drag to reorder" title="Drag to reorder">⋮⋮</button>
    <button type="button" class="nav-jump">
      <span class="nav-number" aria-hidden="true">0</span>
      <span class="nav-title"></span>
    </button>
  `;
  li.querySelector('.nav-title').textContent = title;
  li.querySelector('.nav-jump').addEventListener('click', () => {
    const card = document.getElementById(`item-${item.id}`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!window.matchMedia(DESKTOP_MQ).matches) {
      closeSidebar();
    }
  });
  return li;
}

export function addNavItem(item) {
  if (!navListEl) return;
  navListEl.appendChild(createNavItem(item));
  updateNavEmptyState();
}

export function removeNavItem(itemId) {
  if (!navListEl) return;
  navListEl.querySelector(`.nav-item[data-nav-item-id="${itemId}"]`)?.remove();
  updateNavEmptyState();
}

export function updateNavItemTitle(itemId, title) {
  const el = navListEl?.querySelector(`.nav-item[data-nav-item-id="${itemId}"] .nav-title`);
  if (el) el.textContent = title;
}

function updateNavEmptyState() {
  const empty = document.getElementById('nav-empty');
  if (!empty || !navListEl) return;
  const hasItems = navListEl.querySelectorAll('.nav-item').length > 0;
  empty.classList.toggle('hidden', hasItems);
}

export function syncNavFromMain({ animate = true } = {}) {
  if (!navListEl || !mainListEl || isOrderSyncing()) return;
  const ids = getMainOrderedIds(mainListEl);
  runOrderSync(() => reorderNavList(navListEl, ids, { animate }));
}

export function initNavSortable() {
  if (!navListEl || sortableNav) return;
  sortableNav = Sortable.create(navListEl, {
    animation: 180,
    handle: '.nav-drag',
    draggable: '.nav-item',
    ghostClass: 'sortable-ghost',
    onEnd() {
      if (!mainListEl) return;
      const ids = [...navListEl.querySelectorAll('.nav-item[data-nav-item-id]')].map((el) =>
        Number(el.dataset.navItemId)
      );
      runOrderSync(() => {
        reorderMainList(mainListEl, ids, { animate: true });
        refreshItemNumbers(mainListEl, navListEl);
        persistOrder(ids);
      });
    },
  });
}

export function initSidebarLayout({ listEl, navList, sidebar, toggleBtn, backdrop }) {
  mainListEl = listEl;
  navListEl = navList;

  const desktop = window.matchMedia(DESKTOP_MQ);
  const applyMode = () => {
    if (desktop.matches) {
      document.body.classList.add('sidebar-desktop');
      document.body.classList.remove('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-desktop');
    }
  };
  desktop.addEventListener('change', applyMode);
  applyMode();

  toggleBtn?.addEventListener('click', () => {
    const open = document.body.classList.toggle('sidebar-open');
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  backdrop?.addEventListener('click', closeSidebar);

  initNavSortable();
  updateNavEmptyState();
}

export function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}
