import { state } from './state.js';
import { getSlug, createGroup, deleteGroupApi, renameGroup } from './api.js';
import { buildItemElement, buildDraftElement, fitItemTextarea, GRIP_SVG } from './items.js';
import { setupItemsListSortable } from './drag-drop.js';
import { refreshItemNumbers, getNextItemLabelForItemsList } from './order-sync.js';
import {
  rebuildSidebarNav,
  updateNavItemTitle,
  updateNavGroupName,
} from './sidebar.js';
import { showToast } from './toast.js';
import { confirmDialog } from './confirm-dialog.js';

export const itemHooks = {
  onTitleChange: (id, title) => updateNavItemTitle(id, title),
  onRemoved: () => rebuildSidebarNav(),
};

export function createGroupElement(group) {
  const article = document.createElement('article');
  article.className = 'group-card';
  article.dataset.groupId = String(group.id);

  const header = document.createElement('div');
  header.className = 'group-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'group-title-wrap';

  const dragHandle = document.createElement('button');
  dragHandle.type = 'button';
  dragHandle.className = 'drag-handle';
  dragHandle.setAttribute('aria-label', 'Drag group to reorder');
  dragHandle.innerHTML = GRIP_SVG;

  const nameEl = document.createElement('h2');
  nameEl.className = 'group-name';
  nameEl.textContent = group.name;
  nameEl.title = 'Click to rename';
  nameEl.addEventListener('click', () => handleRenameGroup(group.id, nameEl));

  titleWrap.appendChild(dragHandle);
  titleWrap.appendChild(nameEl);

  const actions = document.createElement('div');
  actions.className = 'group-actions';

  const addInGroupBtn = document.createElement('button');
  addInGroupBtn.type = 'button';
  addInGroupBtn.className = 'btn-add-kirtan';
  addInGroupBtn.title = 'Add kirtan in this group';
  addInGroupBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Add kirtan</span>';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'icon-btn btn-delete-group';
  deleteBtn.title = 'Delete group';
  deleteBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  deleteBtn.addEventListener('click', () => handleDeleteGroup(group.id, article));

  actions.appendChild(addInGroupBtn);
  actions.appendChild(deleteBtn);

  header.appendChild(titleWrap);
  header.appendChild(actions);
  article.appendChild(header);

  const itemsList = document.createElement('ul');
  itemsList.className = 'items-list';
  itemsList.id = `group-items-${group.id}`;

  for (const item of group.items || []) {
    itemsList.appendChild(buildItemElement(item, itemHooks));
  }

  addInGroupBtn.addEventListener('click', () => openDraftInGroup(group.id, itemsList));

  article.appendChild(itemsList);
  setupItemsListSortable(itemsList, group.id);

  return article;
}

let draftOpen = false;

export function openDraftInGroup(groupId, itemsListEl, { onAdded } = {}) {
  if (draftOpen || !itemsListEl) return;
  draftOpen = true;
  const numberLabel = getNextItemLabelForItemsList(itemsListEl);
  const draft = buildDraftElement({
    numberLabel,
    onCancel: () => {
      draftOpen = false;
    },
    onConfirm: async (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed) {
        showToast('Paste some text first', 'danger');
        return;
      }
      const { createItem } = await import('./api.js');
      try {
        const { item, converted } = await createItem(getSlug(), trimmed, groupId);
        draft.remove();
        draftOpen = false;
        const el = buildItemElement(item, itemHooks);
        itemsListEl.appendChild(el);
        fitItemTextarea(el.querySelector('.item-text'));
        rebuildSidebarNav();
        onAdded?.(item, converted);
        if (converted) {
          showToast('Sulekh has been converted to Unicode and is visible on the page');
        }
      } catch {
        showToast('Could not add item', 'danger');
      }
    },
  });
  itemsListEl.prepend(draft);
  const textarea = draft.querySelector('.item-text');
  fitItemTextarea(textarea);
  requestAnimationFrame(() => {
    textarea?.focus();
    draft.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

export function openDraftIfEmptyOnLoad(playlist) {
  const count = (playlist?.groups || []).reduce(
    (n, g) => n + (g.items?.length || 0),
    0
  );
  if (count > 0) return;
  const first = playlist?.groups?.[0];
  if (!first) return;
  const list = document.getElementById(`group-items-${first.id}`);
  openDraftInGroup(first.id, list);
}

export function renderGroups(playlist) {
  const container = document.getElementById('groups-container');
  if (!container) return;
  container.innerHTML = '';

  for (const group of playlist.groups || []) {
    container.appendChild(createGroupElement(group));
  }

  const navListEl = document.getElementById('nav-list');
  refreshItemNumbers(navListEl);
  rebuildSidebarNav();
}

export async function handleAddGroup(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return;
  try {
    const newGroup = await createGroup(getSlug(), trimmed);
    newGroup.items = newGroup.items || [];
    if (!state.playlist.groups) state.playlist.groups = [];
    state.playlist.groups.push(newGroup);

    const container = document.getElementById('groups-container');
    container.appendChild(createGroupElement(newGroup));
    rebuildSidebarNav();
  } catch {
    showToast('Failed to add group', 'danger');
  }
}

function handleRenameGroup(groupId, nameEl) {
  const current = nameEl.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.className = 'add-group-input';
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  const save = async () => {
    const newName = input.value.trim();
    if (newName && newName !== current) {
      nameEl.textContent = newName;
      input.replaceWith(nameEl);
      try {
        await renameGroup(groupId, newName);
        updateNavGroupName(groupId, newName);
      } catch {
        showToast('Failed to rename group', 'danger');
      }
    } else {
      input.replaceWith(nameEl);
    }
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      input.removeEventListener('blur', save);
      save();
    } else if (e.key === 'Escape') {
      input.removeEventListener('blur', save);
      input.replaceWith(nameEl);
    }
  });
}

async function handleDeleteGroup(groupId, groupCard) {
  const groups = state.playlist?.groups || [];
  if (groups.length <= 1) {
    showToast('Keep at least one group', 'danger');
    return;
  }

  const groupName = groupCard.querySelector('.group-name')?.textContent?.trim() || '';
  const itemCount = groupCard.querySelectorAll('.item-card[data-item-id]').length;
  let message;
  if (groupName) {
    message = itemCount > 0
      ? `Are you sure you want to delete "${groupName}" and the ${itemCount} kirtan${itemCount === 1 ? '' : 's'} inside it?`
      : `Are you sure you want to delete "${groupName}"?`;
  } else {
    message = itemCount > 0
      ? `Are you sure you want to delete this group and all ${itemCount} kirtans inside it?`
      : 'Are you sure you want to delete this group?';
  }

  const confirmed = await confirmDialog({
    title: 'Delete group?',
    message,
    confirmText: 'Delete group',
    cancelText: 'Cancel',
    danger: true,
  });
  if (!confirmed) return;

  try {
    await deleteGroupApi(groupId);
    groupCard.remove();
    state.playlist.groups = groups.filter((g) => String(g.id) !== String(groupId));
    const navListEl = document.getElementById('nav-list');
    refreshItemNumbers(navListEl);
    rebuildSidebarNav();
  } catch {
    showToast('Failed to delete group', 'danger');
  }
}

export function openDraftInLastGroup() {
  const groups = state.playlist?.groups || [];
  const last = groups[groups.length - 1];
  if (!last) return;
  const list = document.getElementById(`group-items-${last.id}`);
  openDraftInGroup(last.id, list);
}
