import * as groupService from '../services/group.service.js';

export async function createGroup(req, res) {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const group = await groupService.createGroup(req.params.slug, name);
  if (!group) return res.status(404).json({ error: 'Playlist not found' });
  res.status(201).json(group);
}

export async function updateGroup(req, res) {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const group = await groupService.renameGroup(Number(req.params.id), name);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json({ group });
}

export async function deleteGroup(req, res) {
  const ok = await groupService.removeGroup(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Group not found' });
  res.status(204).end();
}

export async function reorderGroups(req, res) {
  const groupIds = req.body?.groupIds;
  if (!Array.isArray(groupIds)) return res.status(400).json({ error: 'groupIds array required' });
  const ok = await groupService.reorderGroups(req.params.slug, groupIds.map(Number));
  if (!ok) return res.status(404).json({ error: 'Playlist not found' });
  res.json({ ok: true });
}

export async function reorderGroupItems(req, res) {
  const itemIds = req.body?.itemIds;
  if (!Array.isArray(itemIds)) return res.status(400).json({ error: 'itemIds array required' });
  const ok = await groupService.reorderItemsInGroup(Number(req.params.id), itemIds.map(Number));
  if (!ok) return res.status(404).json({ error: 'Group not found' });
  res.json({ ok: true });
}
