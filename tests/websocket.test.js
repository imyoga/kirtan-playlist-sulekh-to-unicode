import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { WebSocket } from 'ws';
import {
  initWebSocketServer,
  broadcastToPlaylist,
  getConnectedClientCount,
  closeWebSocketServer,
} from '../src/ws/server.js';

describe('WebSocket real-time sync server', () => {
  let server;
  let port;

  before(async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('ok');
    });
    initWebSocketServer(server);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    closeWebSocketServer();
    await new Promise((resolve) => server.close(resolve));
  });

  function createClient(slug, clientId) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?slug=${slug}&clientId=${clientId}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  }

  it('rejects connection if slug is missing', async () => {
    await assert.rejects(
      new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        ws.on('open', () => {
          ws.close();
          resolve();
        });
        ws.on('error', reject);
      })
    );
  });

  it('broadcasts to other clients on the same playlist, excluding the sender', async () => {
    const slug = 'test-slug-1';
    const clientA = await createClient(slug, 'client-a');
    const clientB = await createClient(slug, 'client-b');
    const clientC = await createClient(slug, 'client-c');

    assert.equal(getConnectedClientCount(slug), 3);

    const receivedByA = [];
    const receivedByB = [];
    const receivedByC = [];

    clientA.on('message', (data) => receivedByA.push(JSON.parse(data.toString())));
    clientB.on('message', (data) => receivedByB.push(JSON.parse(data.toString())));
    clientC.on('message', (data) => receivedByC.push(JSON.parse(data.toString())));

    // Broadcast from client-a
    broadcastToPlaylist(
      slug,
      { type: 'item:update', itemId: 123, text: 'Hello from A', senderId: 'client-a' },
      'client-a'
    );

    // Wait for message delivery
    await new Promise((resolve) => setTimeout(resolve, 50));

    // A was excluded
    assert.equal(receivedByA.length, 0);
    // B and C received it
    assert.equal(receivedByB.length, 1);
    assert.equal(receivedByB[0].text, 'Hello from A');
    assert.equal(receivedByC.length, 1);
    assert.equal(receivedByC[0].text, 'Hello from A');

    clientA.close();
    clientB.close();
    clientC.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(getConnectedClientCount(slug), 0);
  });

  it('isolates broadcasts by playlist slug', async () => {
    const slug1 = 'playlist-one';
    const slug2 = 'playlist-two';

    const clientP1 = await createClient(slug1, 'user-1');
    const clientP2 = await createClient(slug2, 'user-2');

    const receivedP1 = [];
    const receivedP2 = [];

    clientP1.on('message', (data) => receivedP1.push(JSON.parse(data.toString())));
    clientP2.on('message', (data) => receivedP2.push(JSON.parse(data.toString())));

    broadcastToPlaylist(slug1, { type: 'playlist:title', title: 'New Title 1' });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(receivedP1.length, 1);
    assert.equal(receivedP1[0].title, 'New Title 1');
    assert.equal(receivedP2.length, 0); // User on playlist 2 must not receive it

    clientP1.close();
    clientP2.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});
