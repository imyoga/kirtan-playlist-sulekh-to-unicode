import express from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as playlistController from '../../controllers/playlist.controller.js';

const router = express.Router();

router.post('/playlists', asyncHandler(playlistController.createPlaylist));
router.get('/playlists/:slug', asyncHandler(playlistController.getPlaylist));
router.post('/playlists/:slug/items', asyncHandler(playlistController.addItem));
router.put('/playlists/:slug/items/positions', asyncHandler(playlistController.reorderItems));
router.patch('/items/:id', asyncHandler(playlistController.patchItem));
router.delete('/items/:id', asyncHandler(playlistController.deleteItem));
router.post('/convert/to-sulekh', asyncHandler(playlistController.toSulekh));
router.post('/convert/to-unicode', asyncHandler(playlistController.toUnicode));

export default router;
