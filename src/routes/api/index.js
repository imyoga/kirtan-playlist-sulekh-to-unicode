import express from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as playlistController from '../../controllers/playlist.controller.js';
import * as groupController from '../../controllers/group.controller.js';
import groupRoutes from './group.routes.js';

const router = express.Router();

router.post('/playlists', asyncHandler(playlistController.createPlaylist));
router.get('/playlists/:slug', asyncHandler(playlistController.getPlaylist));
router.patch('/playlists/:slug', asyncHandler(playlistController.patchPlaylist));
router.post('/playlists/:slug/groups', asyncHandler(groupController.createGroup));
router.put('/playlists/:slug/groups/positions', asyncHandler(groupController.reorderGroups));
router.post('/playlists/:slug/items', asyncHandler(playlistController.addItem));
router.patch('/items/:id', asyncHandler(playlistController.patchItem));
router.delete('/items/:id', asyncHandler(playlistController.deleteItem));
router.post('/convert/to-sulekh', asyncHandler(playlistController.toSulekh));
router.post('/convert/to-unicode', asyncHandler(playlistController.toUnicode));
router.use('/groups', groupRoutes);

export default router;
