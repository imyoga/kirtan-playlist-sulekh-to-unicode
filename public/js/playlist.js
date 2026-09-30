import { getSlug, fetchPlaylist } from './api.js';
import { initSidebarLayout } from './sidebar.js';
import {
  renderGroups,
  handleAddGroup,
  openDraftInLastGroup,
  openDraftIfEmptyOnLoad,
} from './groups.js';
import { initGroupsSortable } from './drag-drop.js';
import { state, setPlaylist } from './state.js';
import { setPlaylistTitleDisplay, makeTitleEditable } from './playlist-title.js';
import { handleShare } from './share.js';
import { showToast } from './toast.js';

const slug = getSlug();
state.slug = slug;
const notFound = document.body.dataset.notFound === 'true';
const notFoundEl = document.getElementById('not-found');
const addBtn = document.getElementById('add-item-btn');
const addGroupForm = document.getElementById('add-group-form');
const addGroupInput = document.getElementById('add-group-input');
const showAddGroupBtn = document.getElementById('show-add-group-btn');

async function init() {
  initSidebarLayout({
    navList: document.getElementById('nav-list'),
    sidebar: document.getElementById('playlist-sidebar'),
    toggleBtn: document.getElementById('sidebar-toggle'),
    backdrop: document.getElementById('sidebar-backdrop'),
  });

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
    setPlaylist(playlist);
    setPlaylistTitleDisplay(playlist.title);
    renderGroups(playlist);
    initGroupsSortable(document.getElementById('groups-container'));
    openDraftIfEmptyOnLoad(playlist);
  } catch {
    showToast('Failed to load playlist', 'danger');
  }
}

addBtn?.addEventListener('click', () => openDraftInLastGroup());

document.getElementById('display-title')?.addEventListener('click', makeTitleEditable);
document.getElementById('edit-title-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  makeTitleEditable();
});
document.getElementById('share-btn')?.addEventListener('click', handleShare);

showAddGroupBtn?.addEventListener('click', () => {
  addGroupForm?.classList.remove('hidden');
  showAddGroupBtn.classList.add('hidden');
  addGroupInput?.focus();
});

addGroupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  await handleAddGroup(addGroupInput?.value);
  if (addGroupInput) addGroupInput.value = '';
  addGroupForm?.classList.add('hidden');
  showAddGroupBtn?.classList.remove('hidden');
});

init();
