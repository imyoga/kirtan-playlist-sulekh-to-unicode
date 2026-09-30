import Sortable from '../vendor/sortable.esm.js';
import { itemTitleFromText } from './title.js';
import { GRIP_SVG } from './items.js';
import {
  syncMainFromNavStructure,
  persistAllGroupPositions,
  runOrderSync,
  refreshItemNumbers,
} from './order-sync.js';

const DESKTOP_MQ = '(min-width: 960px)';

let navListEl = null;
const navItemSortables = [];

export function createNavItem(item) {
  const li = document.createElement('li');
  li.className = 'nav-item';
  li.dataset.navItemId = String(item.id);
  const title = itemTitleFromText(item.text || '');
  li.innerHTML = `
    <button type="button" class="nav-drag" aria-label="Drag to reorder" title="Drag to reorder">${GRIP_SVG}</button>
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

function createNavGroupSection(groupId, groupName, items) {
  const section = document.createElement('li');
  section.className = 'nav-group';
  section.dataset.navGroupId = String(groupId);

  const heading = document.createElement('div');
  heading.className = 'nav-group-heading';
  heading.textContent = groupName;

  const itemsList = document.createElement('ul');
  itemsList.className = 'nav-group-items';

  for (const item of items) {
    itemsList.appendChild(createNavItem(item));
  }

  section.appendChild(heading);
  section.appendChild(itemsList);
  return section;
}

export function rebuildSidebarNav() {
  if (!navListEl) return;
  const container = document.getElementById('groups-container');
  if (!container) return;

  destroyNavSortables();
  navListEl.innerHTML = '';

  const groupCards = container.querySelectorAll('.group-card[data-group-id]');
  for (const groupCard of groupCards) {
    const groupId = groupCard.dataset.groupId;
    const groupName = groupCard.querySelector('.group-name')?.textContent?.trim() || 'Group';
    const cards = groupCard.querySelectorAll('.item-card[data-item-id]');
    const items = [...cards].map((card) => ({
      id: Number(card.dataset.itemId),
      text: card.querySelector('.item-text')?.value || '',
    }));
    navListEl.appendChild(createNavGroupSection(groupId, groupName, items));
  }

  updateNavEmptyState();
  refreshItemNumbers(navListEl);
  initNavSortables();
}

export function updateNavGroupName(groupId, name) {
  const heading = navListEl?.querySelector(
    `.nav-group[data-nav-group-id="${groupId}"] .nav-group-heading`
  );
  if (heading) heading.textContent = name;
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

function destroyNavSortables() {
  while (navItemSortables.length) {
    navItemSortables.pop()?.destroy();
  }
}

function initNavSortables() {
  if (!navListEl) return;
  destroyNavSortables();

  navListEl.querySelectorAll('.nav-group-items').forEach((listEl) => {
    const sortable = Sortable.create(listEl, {
      group: { name: 'kirtan-nav-items', pull: true, put: true },
      animation: 180,
      handle: '.nav-drag',
      draggable: '.nav-item',
      ghostClass: 'sortable-ghost',
      onEnd() {
        runOrderSync(() => {
          syncMainFromNavStructure();
          refreshItemNumbers(navListEl);
          persistAllGroupPositions();
        });
      },
    });
    navItemSortables.push(sortable);
  });
}

export function initSidebarLayout({ navList, sidebar, toggleBtn, backdrop }) {
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

  updateNavEmptyState();
}

export function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}
