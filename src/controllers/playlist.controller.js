import config from '../config/index.js';
import * as playlistService from '../services/playlist.service.js';
import { renderLandingHtml, renderPlaylistHtml } from '../utils/htmlTemplate.js';

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
  const html = renderPlaylistHtml({ slug, baseUrl, notFound: false });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
}

export async function createPlaylist(req, res) {
  const playlist = await playlistService.createPlaylist();
  res.status(201).json(playlist);
}

export async function getPlaylist(req, res) {
  const playlist = await playlistService.getPlaylist(req.params.slug);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
  res.json(playlist);
}

export async function addItem(req, res) {
  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });
  const result = await playlistService.addItem(req.params.slug, text);
  if (!result) return res.status(404).json({ error: 'Playlist not found' });
  res.status(201).json(result);
}

export async function patchItem(req, res) {
  const text = req.body?.text;
  if (typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  const item = await playlistService.updateItem(Number(req.params.id), text);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ item });
}

export async function deleteItem(req, res) {
  const ok = await playlistService.removeItem(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Item not found' });
  res.status(204).end();
}

export async function reorderItems(req, res) {
  const itemIds = req.body?.itemIds;
  if (!Array.isArray(itemIds)) return res.status(400).json({ error: 'itemIds array required' });
  const ok = await playlistService.reorderItems(req.params.slug, itemIds.map(Number));
  if (!ok) return res.status(404).json({ error: 'Playlist not found' });
  res.json({ ok: true });
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
