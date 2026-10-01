import * as groupService from '../services/group.service.js';
import { broadcastToPlaylist } from '../ws/server.js';

export async function createGroup(req, res) {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const group = await groupService.createGroup(req.params.slug, name);
  if (!group) return res.status(404).json({ error: 'Playlist not found' });

  const clientId = req.get('x-client-id') || null;
  broadcastToPlaylist(
    req.params.slug,
    {
      type: 'group:add',
      group,
      senderId: clientId,
    },
    clientId
  );

  res.status(201).json(group);
}

export async function updateGroup(req, res) {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const group = await groupService.renameGroup(Number(req.params.id), name);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const clientId = req.get('x-client-id') || null;
  if (group.slug) {
    broadcastToPlaylist(
      group.slug,
      {
        type: 'group:rename',
        groupId: group.id,
        name: group.name,
        group,
        senderId: clientId,
      },
      clientId
    );
  }

  res.json({ group });
}

export async function deleteGroup(req, res) {
  const groupId = Number(req.params.id);
  const slug = await groupService.getPlaylistSlugByGroupId(groupId);
  const ok = await groupService.removeGroup(groupId);
  if (!ok) return res.status(404).json({ error: 'Group not found' });

  const clientId = req.get('x-client-id') || null;
  if (slug) {
    broadcastToPlaylist(
      slug,
      {
        type: 'group:delete',
        groupId,
        senderId: clientId,
      },
      clientId
    );
  }

  res.status(204).end();
}

export async function reorderGroups(req, res) {
  const groupIds = req.body?.groupIds;
  if (!Array.isArray(groupIds)) return res.status(400).json({ error: 'groupIds array required' });
  const ok = await groupService.reorderGroups(req.params.slug, groupIds.map(Number));
  if (!ok) return res.status(404).json({ error: 'Playlist not found' });

  const clientId = req.get('x-client-id') || null;
  broadcastToPlaylist(
    req.params.slug,
    {
      type: 'group:reorder',
      groupIds: groupIds.map(Number),
      senderId: clientId,
    },
    clientId
  );

  res.json({ ok: true });
}

export async function reorderGroupItems(req, res) {
  const itemIds = req.body?.itemIds;
  if (!Array.isArray(itemIds)) return res.status(400).json({ error: 'itemIds array required' });
  const groupId = Number(req.params.id);
  const result = await groupService.reorderItemsInGroup(groupId, itemIds.map(Number));
  if (!result) return res.status(404).json({ error: 'Group not found' });

  const clientId = req.get('x-client-id') || null;
  if (result.slug) {
    broadcastToPlaylist(
      result.slug,
      {
        type: 'item:reorder',
        groupId,
        itemIds: itemIds.map(Number),
        senderId: clientId,
      },
      clientId
    );
  }

  res.json({ ok: true });
}
