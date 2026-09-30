import { savePositions, getSlug } from './api.js';
import { showToast } from './toast.js';

let syncing = false;

export function isOrderSyncing() {
  return syncing;
}

export function getMainOrderedIds(listEl) {
  return [...listEl.querySelectorAll('.item-card[data-item-id]')].map((el) =>
    Number(el.dataset.itemId)
  );
}

export function refreshItemNumbers(listEl, navListEl) {
  if (!listEl) return;
  const ids = getMainOrderedIds(listEl);
  const total = ids.length;

  const countEl = document.getElementById('sidebar-item-count');
  if (countEl) {
    countEl.textContent = total ? String(total) : '0';
    countEl.setAttribute('aria-label', `${total} kirtan`);
  }

  ids.forEach((id, index) => {
    const n = String(index + 1);
    const cardNum = listEl.querySelector(
      `.item-card[data-item-id="${id}"] .item-number`
    );
    const navNum = navListEl?.querySelector(
      `.nav-item[data-nav-item-id="${id}"] .nav-number`
    );
    if (cardNum) cardNum.textContent = n;
    if (navNum) navNum.textContent = n;
  });
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

export function reorderMainList(listEl, ids, { animate = true } = {}) {
  const draft = listEl.querySelector('.item-card.is-draft');
  const map = new Map();
  listEl.querySelectorAll('.item-card[data-item-id]').forEach((el) => {
    map.set(Number(el.dataset.itemId), el);
  });

  const moved = [];
  if (draft) {
    listEl.prepend(draft);
  }
  for (const id of ids) {
    const el = map.get(id);
    if (el) {
      listEl.appendChild(el);
      moved.push(el);
    }
  }
  if (animate) flashElements(moved);
}

export function reorderNavList(navListEl, ids, { animate = true } = {}) {
  const map = new Map();
  navListEl.querySelectorAll('.nav-item[data-nav-item-id]').forEach((el) => {
    map.set(Number(el.dataset.navItemId), el);
  });

  const moved = [];
  for (const id of ids) {
    const el = map.get(id);
    if (el) {
      navListEl.appendChild(el);
      moved.push(el);
    }
  }
  if (animate) flashElements(moved);
}

export async function persistOrder(ids) {
  const slug = getSlug();
  try {
    await savePositions(slug, ids);
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
