import config from '../config/index.js';
import * as playlistService from '../services/playlist.service.js';
import { renderLandingHtml, renderPlaylistHtml } from '../utils/htmlTemplate.js';
import { broadcastToPlaylist } from '../ws/server.js';

function getBaseUrl(req) {
  return config.baseUrl || `${req.protocol}://${req.get('host')}`;
}

export function renderLanding(req, res) {
  const html = renderLandingHtml(getBaseUrl(req));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

export async function renderPlaylist(req, res) {
  const { slug } = req.params;
  const playlist = await playlistService.getPlaylist(slug);
  const baseUrl = getBaseUrl(req);
  if (!playlist) {
    const html = renderPlaylistHtml({ slug, baseUrl, notFound: true });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(html);
  }
  const html = renderPlaylistHtml({
    slug,
    baseUrl,
    title: playlist.title || 'Kirtan Playlist',
    notFound: false,
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
}

export async function createPlaylist(req, res) {
  const title = req.body?.title;
  const playlist = await playlistService.createPlaylist(title);
  res.status(201).json(playlist);
}

export async function patchPlaylist(req, res) {
  const title = (req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  const playlist = await playlistService.updatePlaylistTitle(req.params.slug, title);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

  const clientId = req.get('x-client-id') || null;
  broadcastToPlaylist(
    req.params.slug,
    {
      type: 'playlist:title',
      title: playlist.title,
      playlist,
      senderId: clientId,
    },
    clientId
  );

  res.json({ playlist });
}

export async function getPlaylist(req, res) {
  const playlist = await playlistService.getPlaylist(req.params.slug);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  res.json(playlist);
}

export async function addItem(req, res) {
  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });
  const groupId = req.body?.groupId ? Number(req.body.groupId) : undefined;
  const result = await playlistService.addItem(req.params.slug, text, groupId);
  if (!result) return res.status(404).json({ error: 'Playlist not found' });

  const clientId = req.get('x-client-id') || null;
  broadcastToPlaylist(
    req.params.slug,
    {
      type: 'item:add',
      item: result.item,
      converted: result.converted,
      senderId: clientId,
    },
    clientId
  );

  res.status(201).json(result);
}

export async function patchItem(req, res) {
  const text = req.body?.text;
  if (typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  const item = await playlistService.updateItem(Number(req.params.id), text);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const clientId = req.get('x-client-id') || null;
  if (item.slug) {
    broadcastToPlaylist(
      item.slug,
      {
        type: 'item:update',
        item,
        senderId: clientId,
      },
      clientId
    );
  }

  res.json({ item });
}

export async function deleteItem(req, res) {
  const itemId = Number(req.params.id);
  const slug = await playlistService.getPlaylistSlugByItemId(itemId);
  const ok = await playlistService.removeItem(itemId);
  if (!ok) return res.status(404).json({ error: 'Item not found' });

  const clientId = req.get('x-client-id') || null;
  if (slug) {
    broadcastToPlaylist(
      slug,
      {
        type: 'item:delete',
        itemId,
        senderId: clientId,
      },
      clientId
    );
  }

  res.status(204).end();
}

export async function toSulekh(req, res) {
  const text = req.body?.text;
  if (typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  res.json({ text: playlistService.convertToSulekh(text) });
}

export async function toUnicode(req, res) {
  const text = req.body?.text;
  if (typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  res.json({ text: playlistService.convertToUnicode(text) });
}
