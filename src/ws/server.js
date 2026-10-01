import { WebSocketServer, WebSocket } from 'ws';

let wss = null;
let heartbeatInterval = null;
const rooms = new Map(); // slug -> Set<WebSocket>

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/ws') {
        const slug = url.searchParams.get('slug');
        const clientId = url.searchParams.get('clientId') || '';

        if (!slug) {
          socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
          socket.destroy();
          return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
          ws.slug = slug;
          ws.clientId = clientId;
          ws.isAlive = true;
          wss.emit('connection', ws, req);
        });
      } else {
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    const slug = ws.slug;
    if (!rooms.has(slug)) {
      rooms.set(slug, new Set());
    }
    rooms.get(slug).add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      removeClient(ws);
    });

    ws.on('error', () => {
      removeClient(ws);
    });
  });

  heartbeatInterval = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        removeClient(ws);
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  return wss;
}

function removeClient(ws) {
  const slug = ws.slug;
  if (slug && rooms.has(slug)) {
    const room = rooms.get(slug);
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(slug);
    }
  }
}

export function broadcastToPlaylist(slug, message, excludeClientId = null) {
  if (!slug || !rooms.has(slug)) return;
  const room = rooms.get(slug);
  const payload = typeof message === 'string' ? message : JSON.stringify(message);

  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      if (excludeClientId && client.clientId === excludeClientId) {
        continue;
      }
      client.send(payload);
    }
  }
}

export function getConnectedClientCount(slug) {
  if (!slug || !rooms.has(slug)) return 0;
  return rooms.get(slug).size;
}

export function closeWebSocketServer() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (wss) {
    for (const client of wss.clients) {
      try {
        client.terminate();
      } catch {
        /* ignore */
      }
    }
    rooms.clear();
    wss.close();
    wss = null;
  }
}
