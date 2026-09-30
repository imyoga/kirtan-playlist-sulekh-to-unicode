import * as db from '../../db.js';
import { preparePlaylistText } from '../converter/index.js';
import { unicodeToSulekh } from '../converter/unicodeToSulekh.js';
import { sulekhToUnicode } from '../converter/sulekhToUnicode.js';

export async function createPlaylist() {
  return db.createPlaylist();
}

export async function getPlaylist(slug) {
  return db.getPlaylistBySlug(slug);
}

export async function addItem(slug, rawText) {
  const playlist = await db.getPlaylistBySlug(slug);
  if (!playlist) return null;
  const { unicode, converted } = preparePlaylistText(rawText);
  const position = await db.getNextItemPosition(slug);
  const item = await db.createItem(slug, unicode, position);
  return { item, converted };
}

export async function updateItem(itemId, text) {
  return db.updateItemText(itemId, text);
}

export async function removeItem(itemId) {
  return db.deleteItem(itemId);
}

export async function reorderItems(slug, itemIds) {
  return db.updateItemPositions(slug, itemIds);
}

export function convertToSulekh(text) {
  return unicodeToSulekh(text);
}

export function convertToUnicode(text) {
  return sulekhToUnicode(text);
}
