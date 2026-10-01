import * as db from '../../db.js';
import { preparePlaylistText } from '../converter/index.js';
import { unicodeToSulekh } from '../converter/unicodeToSulekh.js';
import { sulekhToUnicode } from '../converter/sulekhToUnicode.js';

export async function createPlaylist(title) {
  return db.createPlaylist(title);
}

export async function updatePlaylistTitle(slug, title) {
  return db.updatePlaylistTitle(slug, title);
}

export async function getPlaylist(slug) {
  return db.getPlaylistBySlug(slug);
}

export async function addItem(slug, rawText, groupId) {
  const playlist = await db.getPlaylistBySlug(slug);
  if (!playlist) return null;

  let targetGroupId = groupId;
  if (!targetGroupId) {
    targetGroupId = await db.getDefaultGroupId(slug);
  }
  if (!targetGroupId) return null;

  const { unicode, converted } = preparePlaylistText(rawText);
  const position = await db.getNextItemPositionInGroup(targetGroupId);
  const item = await db.createItemInGroup(targetGroupId, unicode, position);
  return { item, converted };
}

export async function updateItem(itemId, text) {
  return db.updateItemText(itemId, text);
}

export async function removeItem(itemId) {
  return db.deleteItem(itemId);
}

export async function getPlaylistSlugByItemId(itemId) {
  return db.getPlaylistSlugByItemId(itemId);
}

export function convertToSulekh(text) {
  return unicodeToSulekh(text);
}

export function convertToUnicode(text) {
  return sulekhToUnicode(text);
}
