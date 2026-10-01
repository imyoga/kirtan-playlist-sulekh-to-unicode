import { CLIENT_ID, fetchPlaylist } from './api.js';
import { state, setPlaylist } from './state.js';
import { flashViewportSyncBorder } from './sync-indicator.js';
import { setPlaylistTitleDisplay } from './playlist-title.js';
import { createGroupElement, itemHooks, renderGroups } from './groups.js';
import { buildItemElement, fitItemTextarea } from './items.js';
import { refreshItemNumbers } from './order-sync.js';
import {
  rebuildSidebarNav,
  updateNavGroupName,
  updateNavItemTitle,
} from './sidebar.js';
import { itemTitleFromText } from './title.js';

let socket = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let isFirstConnect = true;

export function initWebSocket(slug) {
  if (!slug) return;

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?slug=${encodeURIComponent(slug)}&clientId=${encodeURIComponent(CLIENT_ID)}`;

    try {
      socket = new WebSocket(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = async () => {
      reconnectDelay = 1000;
      if (!isFirstConnect) {
        // Reconnected: catch up on any offline changes
        try {
          const fresh = await fetchPlaylist(slug);
          if (fresh) {
            setPlaylist(fresh);
            setPlaylistTitleDisplay(fresh.title);
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            if (activeTag !== 'textarea' && activeTag !== 'input') {
              renderGroups(fresh);
            }
          }
        } catch {
          /* ignore */
        }
      }
      isFirstConnect = false;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRemoteEvent(data);
      } catch {
        /* ignore invalid message */
      }
    };

    socket.onclose = () => {
      scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectDelay = Math.min(reconnectDelay * 1.5, 8000);
      connect();
    }, reconnectDelay);
  }

  connect();
}

function handleRemoteEvent(data) {
  if (!data || !data.type) return;

  // Ignore events sent by our own tab
  if (data.senderId && data.senderId === CLIENT_ID) {
    return;
  }

  // Trigger moving dotted border around the viewport for 1 second
  flashViewportSyncBorder(1000);

  const navListEl = document.getElementById('nav-list');
  const container = document.getElementById('groups-container');

  switch (data.type) {
    case 'playlist:title': {
      const title = data.title || 'Kirtan Playlist';
      if (state.playlist) state.playlist.title = title;
      const titleEl = document.getElementById('display-title');
      if (titleEl && titleEl.contentEditable !== 'true') {
        setPlaylistTitleDisplay(title);
      }
      break;
    }

    case 'group:add': {
      const group = data.group;
      if (!group || !container) break;
      const existing = container.querySelector(`.group-card[data-group-id="${group.id}"]`);
      if (existing) break;

      if (!state.playlist.groups) state.playlist.groups = [];
      const inState = state.playlist.groups.find((g) => String(g.id) === String(group.id));
      if (!inState) {
        state.playlist.groups.push(group);
      }

      container.appendChild(createGroupElement(group));
      refreshItemNumbers(navListEl);
      rebuildSidebarNav();
      break;
    }

    case 'group:rename': {
      const { groupId, name } = data;
      if (!groupId || !name) break;
      const card = container?.querySelector(`.group-card[data-group-id="${groupId}"]`);
      if (card) {
        const nameEl = card.querySelector('.group-name');
        if (nameEl) {
          nameEl.textContent = name;
        }
      }
      const grp = state.playlist?.groups?.find((g) => String(g.id) === String(groupId));
      if (grp) grp.name = name;
      updateNavGroupName(groupId, name);
      break;
    }

    case 'group:delete': {
      const { groupId } = data;
      if (!groupId) break;
      const card = container?.querySelector(`.group-card[data-group-id="${groupId}"]`);
      if (card) card.remove();
      if (state.playlist?.groups) {
        state.playlist.groups = state.playlist.groups.filter((g) => String(g.id) !== String(groupId));
      }
      refreshItemNumbers(navListEl);
      rebuildSidebarNav();
      break;
    }

    case 'group:reorder': {
      const { groupIds } = data;
      if (!Array.isArray(groupIds) || !container) break;
      for (const id of groupIds) {
        const card = container.querySelector(`.group-card[data-group-id="${id}"]`);
        if (card) container.appendChild(card);
      }
      if (state.playlist?.groups) {
        const map = new Map(state.playlist.groups.map((g) => [g.id, g]));
        state.playlist.groups = groupIds.map((id) => map.get(id)).filter(Boolean);
      }
      refreshItemNumbers(navListEl);
      rebuildSidebarNav();
      break;
    }

    case 'item:add': {
      const item = data.item;
      if (!item) break;
      const existing = document.getElementById(`item-${item.id}`);
      if (existing) break;

      const itemsList = document.getElementById(`group-items-${item.group_id}`);
      if (itemsList) {
        const el = buildItemElement(item, itemHooks);
        itemsList.appendChild(el);
        fitItemTextarea(el.querySelector('.item-text'));

        const grp = state.playlist?.groups?.find((g) => String(g.id) === String(item.group_id));
        if (grp) {
          if (!grp.items) grp.items = [];
          grp.items.push(item);
        }

        refreshItemNumbers(navListEl);
        rebuildSidebarNav();
      }
      break;
    }

    case 'item:update': {
      const item = data.item;
      if (!item) break;
      const el = document.getElementById(`item-${item.id}`);
      if (!el) break;

      const textarea = el.querySelector('.item-text');
      // If user is currently typing in this textarea, don't overwrite their in-progress text
      if (textarea && document.activeElement !== textarea) {
        textarea.value = item.text || '';
        fitItemTextarea(textarea);
        const title = itemTitleFromText(textarea.value);
        const titleEl = el.querySelector('.item-title');
        if (titleEl) titleEl.textContent = title;
        updateNavItemTitle(item.id, title);
      }

      for (const g of state.playlist?.groups || []) {
        const it = g.items?.find((i) => String(i.id) === String(item.id));
        if (it) {
          it.text = item.text;
          break;
        }
      }
      break;
    }

    case 'item:delete': {
      const { itemId } = data;
      if (!itemId) break;
      const el = document.getElementById(`item-${itemId}`);
      if (el) el.remove();

      for (const g of state.playlist?.groups || []) {
        if (g.items) {
          g.items = g.items.filter((i) => String(i.id) !== String(itemId));
        }
      }

      refreshItemNumbers(navListEl);
      rebuildSidebarNav();
      break;
    }

    case 'item:reorder': {
      const { groupId, itemIds } = data;
      if (!groupId || !Array.isArray(itemIds)) break;
      const itemsList = document.getElementById(`group-items-${groupId}`);
      if (itemsList) {
        for (const id of itemIds) {
          const card = document.querySelector(`.item-card[data-item-id="${id}"]`);
          if (card) {
            itemsList.appendChild(card);
          }
        }
        refreshItemNumbers(navListEl);
        rebuildSidebarNav();
      }
      break;
    }

    default:
      break;
  }
}
