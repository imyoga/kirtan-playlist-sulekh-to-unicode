import * as db from '../../db.js';

export async function createGroup(slug, name) {
  return db.createGroup(slug, name.trim());
}

export async function renameGroup(groupId, name) {
  return db.updateGroupName(groupId, name.trim());
}

export async function removeGroup(groupId) {
  return db.deleteGroup(groupId);
}

export async function reorderGroups(slug, groupIds) {
  return db.updateGroupPositions(slug, groupIds);
}

export async function reorderItemsInGroup(groupId, itemIds) {
  return db.updateItemPositionsInGroup(groupId, itemIds);
}
