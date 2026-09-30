import { itemTitleFromText } from './title.js';
import { updateItem, deleteItem, fetchSulekh } from './api.js';
import { copyText, showToast } from './toast.js';

const saveTimers = new Map();

function autoGrow(textarea) {
  textarea.style.height = '0';
  const next = Math.max(textarea.scrollHeight, 28);
  textarea.style.height = `${next}px`;
}

function scheduleAutoGrow(textarea) {
  autoGrow(textarea);
  requestAnimationFrame(() => {
    autoGrow(textarea);
    document.fonts?.ready?.then(() => autoGrow(textarea));
  });
}

function iconSvg(name) {
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

function bindItemCard(li, item, { onRemove, isDraft = false, onConfirmDraft } = {}) {
  const titleEl = li.querySelector('.item-title');
  const textarea = li.querySelector('.item-text');

  const refreshTitle = () => {
    titleEl.textContent = itemTitleFromText(textarea.value);
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
    li.querySelector('[data-copy-unicode]')?.addEventListener('click', () => {
      copyText(textarea.value, 'Unicode copied');
    });
    li.querySelector('[data-copy-sulekh]')?.addEventListener('click', async () => {
      try {
        const sulekh = await fetchSulekh(textarea.value);
        copyText(sulekh, 'Sulekh copied');
      } catch {
        showToast('Sulekh copy failed', 'danger');
      }
    });
    li.querySelector('[data-delete]')?.addEventListener('click', async () => {
      try {
        await deleteItem(item.id);
        li.remove();
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

export function buildItemElement(item) {
  const li = document.createElement('li');
  li.className = 'item-card';
  li.dataset.itemId = String(item.id);
  li.innerHTML = `
    <div class="item-top">
      <button type="button" class="drag-handle" aria-label="Drag to reorder">${iconSvg('drag') || '⋮⋮'}</button>
      <span class="item-title"></span>
      <div class="item-actions">
        <button type="button" data-copy-unicode" title="Copy Unicode">${iconSvg('copy')}</button>
        <button type="button" data-copy-sulekh" title="Copy Sulekh">${iconSvg('copy')}</button>
        <button type="button" data-delete" title="Remove">${iconSvg('trash')}</button>
      </div>
    </div>
    <textarea class="item-text" rows="1" spellcheck="false"></textarea>
  `;
  li.querySelector('.item-text').value = item.text || '';
  bindItemCard(li, item);
  return li;
}

export function buildDraftElement({ onConfirm, onCancel }) {
  const li = document.createElement('li');
  li.className = 'item-card is-draft';
  li.innerHTML = `
    <div class="item-top">
      <span class="item-title">New item</span>
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
