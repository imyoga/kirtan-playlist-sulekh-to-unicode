import { getSlug } from './api.js';
import { showToast } from './toast.js';

let syncing = false;

export function getGroupsContainer() {
  return document.getElementById('groups-container');
}

export function isOrderSyncing() {
  return syncing;
}

export function getMainOrderedIds() {
  const container = getGroupsContainer();
  if (!container) return [];
  return [...container.querySelectorAll('.item-card[data-item-id]')].map((el) =>
    Number(el.dataset.itemId)
  );
}

/** Label for the next kirtan added in this group's items list (e.g. "2.3"). */
export function getNextItemLabelForItemsList(itemsListEl) {
  const container = getGroupsContainer();
  if (!container || !itemsListEl) return '';
  const groupCard = itemsListEl.closest('.group-card[data-group-id]');
  if (!groupCard) return '';
  const groupCards = [...container.querySelectorAll('.group-card[data-group-id]')];
  const groupNo = groupCards.indexOf(groupCard) + 1;
  if (groupNo < 1) return '';
  const itemCount = itemsListEl.querySelectorAll('.item-card[data-item-id]').length;
  return `${groupNo}.${itemCount + 1}`;
}

export function refreshItemNumbers(navListEl) {
  const container = getGroupsContainer();
  if (!container) return;

  const groupCards = container.querySelectorAll('.group-card[data-group-id]');
  const numbered = [];
  for (const [groupIndex, groupCard] of [...groupCards].entries()) {
    const groupNo = groupIndex + 1;
    const itemCards = groupCard.querySelectorAll('.item-card[data-item-id]');
    for (const [itemIndex, card] of [...itemCards].entries()) {
      numbered.push({
        id: Number(card.dataset.itemId),
        label: `${groupNo}.${itemIndex + 1}`,
      });
    }
  }

  const total = numbered.length;
  const countEl = document.getElementById('sidebar-item-count');
  if (countEl) {
    countEl.textContent = total ? String(total) : '0';
    countEl.setAttribute('aria-label', `${total} kirtan`);
  }

  for (const { id, label } of numbered) {
    const cardNum = container.querySelector(
      `.item-card[data-item-id="${id}"] .item-number`
    );
    const navNum = navListEl?.querySelector(
      `.nav-item[data-nav-item-id="${id}"] .nav-number`
    );
    if (cardNum) cardNum.textContent = label;
    if (navNum) navNum.textContent = label;
  }
}

function flashElements(elements) {
  for (const el of elements) {
    el.classList.remove('sync-highlight');
    void el.offsetWidth;
    el.classList.add('sync-highlight');
    el.addEventListener(
      'animationend',
      () => el.classList.remove('sync-highlight'),
      { once: true }
    );
  }
}

export function syncMainFromNavStructure() {
  const container = getGroupsContainer();
  const navList = document.getElementById('nav-list');
  if (!container || !navList) return;

  const moved = [];
  const navGroups = navList.querySelectorAll('.nav-group[data-nav-group-id]');

  for (const navGroup of navGroups) {
    const groupId = navGroup.dataset.navGroupId;
    const mainList = container.querySelector(
      `.group-card[data-group-id="${groupId}"] .items-list`
    );
    if (!mainList) continue;

    const navItems = navGroup.querySelectorAll('.nav-item[data-nav-item-id]');
    for (const navItem of navItems) {
      const id = navItem.dataset.navItemId;
      const card = container.querySelector(`.item-card[data-item-id="${id}"]`);
      if (card) {
        mainList.appendChild(card);
        moved.push(card);
      }
    }
  }

  flashElements(moved);
}

export async function persistAllGroupPositions() {
  const container = getGroupsContainer();
  if (!container) return;
  const slug = getSlug();
  const groupCards = container.querySelectorAll('.group-card[data-group-id]');

  try {
    await Promise.all(
      [...groupCards].map((groupCard) => {
        const groupId = groupCard.dataset.groupId;
        const itemIds = [...groupCard.querySelectorAll('.item-card[data-item-id]')].map((el) =>
          Number(el.dataset.itemId)
        );
        return fetch(`/api/groups/${groupId}/items/positions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds }),
        });
      })
    );
    const groupIds = [...groupCards].map((g) => Number(g.dataset.groupId));
    await fetch(`/api/playlists/${encodeURIComponent(slug)}/groups/positions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupIds }),
    });
  } catch {
    showToast('Failed to save order', 'danger');
  }
}

export function runOrderSync(fn) {
  if (syncing) return;
  syncing = true;
  try {
    fn();
  } finally {
    requestAnimationFrame(() => {
      syncing = false;
    });
  }
}
