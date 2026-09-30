import { getSlug, fetchPlaylist, createItem } from './api.js';
import { buildItemElement, buildDraftElement, fitItemTextarea } from './items.js';
import { initSortable } from './drag-drop.js';
import { showToast } from './toast.js';

const slug = getSlug();
const notFound = document.body.dataset.notFound === 'true';
const listEl = document.getElementById('items-list');
const notFoundEl = document.getElementById('not-found');
const addBtn = document.getElementById('add-item-btn');

let draftOpen = false;

function mountItem(item) {
  const el = buildItemElement(item);
  listEl.appendChild(el);
  fitItemTextarea(el.querySelector('.item-text'));
  return el;
}

function openDraft() {
  if (draftOpen || !listEl) return;
  draftOpen = true;
  const draft = buildDraftElement({
    onCancel: () => { draftOpen = false; },
    onConfirm: async (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed) {
        showToast('Paste some text first', 'danger');
        return;
      }
      try {
        const { item, converted } = await createItem(slug, trimmed);
        draft.remove();
        draftOpen = false;
        mountItem(item);
        if (converted) {
          showToast('Sulekh has been converted to Unicode and is visible on the page');
        }
      } catch {
        showToast('Could not add item', 'danger');
      }
    },
  });
  listEl.prepend(draft);
  fitItemTextarea(draft.querySelector('.item-text'));
}

async function init() {
  if (notFound) {
    notFoundEl?.classList.remove('hidden');
    addBtn?.setAttribute('disabled', 'true');
    return;
  }
  try {
    const playlist = await fetchPlaylist(slug);
    if (!playlist) {
      notFoundEl?.classList.remove('hidden');
      addBtn?.setAttribute('disabled', 'true');
      return;
    }
    for (const item of playlist.items || []) {
      mountItem(item);
    }
    initSortable(listEl);
  } catch {
    showToast('Failed to load playlist', 'danger');
  }
}

addBtn?.addEventListener('click', openDraft);
init();
