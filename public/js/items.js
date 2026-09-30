import { itemTitleFromText } from './title.js';
import { updateItem, deleteItem, fetchSulekh } from './api.js';
import { copyText, showToast } from './toast.js';
import { confirmDialog } from './confirm-dialog.js';

const saveTimers = new Map();

function autoGrow(textarea) {
  textarea.style.height = '0';
  const next = Math.max(textarea.scrollHeight, 24);
  textarea.style.height = `${next}px`;
}

function scheduleAutoGrow(textarea) {
  autoGrow(textarea);
  requestAnimationFrame(() => {
    autoGrow(textarea);
    document.fonts?.ready?.then(() => autoGrow(textarea));
  });
}

export const GRIP_SVG =
  '<svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true"><circle cx="4" cy="4" r="1.5"/><circle cx="10" cy="4" r="1.5"/><circle cx="4" cy="9" r="1.5"/><circle cx="10" cy="9" r="1.5"/><circle cx="4" cy="14" r="1.5"/><circle cx="10" cy="14" r="1.5"/></svg>';

function iconSvg(name) {
  if (name === 'drag') return GRIP_SVG;
  if (name === 'copy') {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
  }
  if (name === 'trash') {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  }
  if (name === 'check') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>';
  }
  if (name === 'x') {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  }
  return '';
}

function bindItemCard(li, item, { onRemove, isDraft = false, onConfirmDraft, onTitleChange, onRemoved } = {}) {
  const titleEl = li.querySelector('.item-title');
  const textarea = li.querySelector('.item-text');

  const refreshTitle = () => {
    const title = itemTitleFromText(textarea.value);
    titleEl.textContent = title;
    if (!isDraft && item.id) onTitleChange?.(item.id, title);
  };

  textarea.addEventListener('input', () => {
    scheduleAutoGrow(textarea);
    refreshTitle();
    if (!isDraft && item.id) {
      clearTimeout(saveTimers.get(item.id));
      const t = setTimeout(async () => {
        try {
          await updateItem(item.id, textarea.value);
        } catch {
          showToast('Failed to save', 'danger');
        }
      }, 500);
      saveTimers.set(item.id, t);
    }
  });

  if (isDraft) {
    li.querySelector('.draft-confirm')?.addEventListener('click', () => {
      onConfirmDraft?.(textarea.value);
    });
    li.querySelector('.draft-cancel')?.addEventListener('click', () => {
      li.remove();
      onRemove?.();
    });
    setTimeout(() => textarea.focus(), 0);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onConfirmDraft?.(textarea.value);
      }
    });
  } else {
    li.querySelector('.btn-copy-unicode')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyText(textarea.value, 'Unicode copied');
    });
    li.querySelector('.btn-copy-sulekh')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const sulekh = await fetchSulekh(textarea.value);
        copyText(sulekh, 'Sulekh copied');
      } catch {
        showToast('Sulekh copy failed', 'danger');
      }
    });
    li.querySelector('.btn-delete-item')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentTitle = itemTitleFromText(textarea.value);
      const titleSnippet = currentTitle && currentTitle !== 'Untitled' ? `"${currentTitle}"` : 'this kirtan';
      const confirmed = await confirmDialog({
        title: 'Delete kirtan?',
        message: `Are you sure you want to delete ${titleSnippet}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true,
      });
      if (!confirmed) return;
      try {
        await deleteItem(item.id);
        li.remove();
        onRemoved?.(item.id);
      } catch {
        showToast('Delete failed', 'danger');
      }
    });
  }

  scheduleAutoGrow(textarea);
  refreshTitle();
}

export function fitItemTextarea(textarea) {
  if (textarea) scheduleAutoGrow(textarea);
}

export function buildItemElement(item, hooks = {}) {
  const li = document.createElement('li');
  li.className = 'item-card';
  li.id = `item-${item.id}`;
  li.dataset.itemId = String(item.id);
  li.innerHTML = `
    <div class="item-top">
      <button type="button" class="drag-handle" aria-label="Drag to reorder">${iconSvg('drag') || '⋮⋮'}</button>
      <span class="item-number" aria-hidden="true">0</span>
      <span class="item-title"></span>
      <div class="item-actions">
        <button type="button" class="btn-copy-unicode" data-action="copy-unicode" title="Copy Unicode" aria-label="Copy Unicode">${iconSvg('copy')}</button>
        <button type="button" class="btn-copy-sulekh" data-action="copy-sulekh" title="Copy Sulekh" aria-label="Copy Sulekh">${iconSvg('copy')}</button>
        <button type="button" class="btn-delete-item" data-action="delete" title="Remove" aria-label="Remove">${iconSvg('trash')}</button>
      </div>
    </div>
    <textarea class="item-text" rows="1" spellcheck="false"></textarea>
  `;
  li.querySelector('.item-text').value = item.text || '';
  bindItemCard(li, item, hooks);
  return li;
}

export function buildDraftElement({ onConfirm, onCancel, numberLabel = '' }) {
  const li = document.createElement('li');
  li.className = 'item-card is-draft';
  const num = numberLabel || '—';
  li.innerHTML = `
    <div class="item-top">
      <span class="item-number" aria-hidden="true">${num}</span>
      <span class="item-title">New kirtan</span>
    </div>
    <textarea class="item-text" rows="3" placeholder="Paste Sulekh or Unicode…" spellcheck="false"></textarea>
    <div class="draft-actions">
      <button type="button" class="icon-btn draft-cancel" title="Cancel">${iconSvg('x')}</button>
      <button type="button" class="icon-btn draft-confirm" title="Add">${iconSvg('check')}</button>
    </div>
  `;
  const draftItem = { id: null };
  bindItemCard(li, draftItem, {
    isDraft: true,
    onRemove: onCancel,
    onConfirmDraft: onConfirm,
  });
  return li;
}
