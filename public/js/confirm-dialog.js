export function confirmDialog({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
} = {}) {
  return new Promise((resolve) => {
    const prevActiveElement = document.activeElement;

    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-backdrop';
    backdrop.setAttribute('role', 'alertdialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'confirm-dialog-title');
    backdrop.setAttribute('aria-describedby', 'confirm-dialog-message');

    const iconSvg = danger
      ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
      : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    dialog.innerHTML = `
      <div class="confirm-dialog-content">
        <div class="confirm-dialog-header">
          <div class="confirm-dialog-icon ${danger ? 'danger' : 'info'}">
            ${iconSvg}
          </div>
          <h2 id="confirm-dialog-title" class="confirm-dialog-title"></h2>
        </div>
        <p id="confirm-dialog-message" class="confirm-dialog-message"></p>
      </div>
      <div class="confirm-dialog-actions">
        <button type="button" class="btn-confirm-cancel"></button>
        <button type="button" class="btn-confirm-ok ${danger ? 'danger' : 'primary'}"></button>
      </div>
    `;

    dialog.querySelector('#confirm-dialog-title').textContent = title;
    dialog.querySelector('#confirm-dialog-message').textContent = message;

    const cancelBtn = dialog.querySelector('.btn-confirm-cancel');
    const okBtn = dialog.querySelector('.btn-confirm-ok');

    cancelBtn.textContent = cancelText;
    okBtn.textContent = confirmText;

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    let isClosed = false;
    const cleanup = (result) => {
      if (isClosed) return;
      isClosed = true;

      backdrop.classList.remove('is-visible');
      document.removeEventListener('keydown', onKeyDown);

      setTimeout(() => {
        backdrop.remove();
        if (prevActiveElement && typeof prevActiveElement.focus === 'function') {
          try {
            prevActiveElement.focus();
          } catch {
            // Ignore if element is no longer in the DOM
          }
        }
        resolve(result);
      }, 200);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup(false);
      } else if (e.key === 'Tab') {
        const focusable = [cancelBtn, okBtn];
        if (e.shiftKey) {
          if (document.activeElement === cancelBtn) {
            e.preventDefault();
            okBtn.focus();
          }
        } else {
          if (document.activeElement === okBtn) {
            e.preventDefault();
            cancelBtn.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);

    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup(false);
    });

    okBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup(true);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(false);
      }
    });

    requestAnimationFrame(() => {
      backdrop.classList.add('is-visible');
      cancelBtn.focus();
    });
  });
}
