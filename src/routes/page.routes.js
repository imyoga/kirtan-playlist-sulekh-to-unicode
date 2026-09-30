import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as playlistController from '../controllers/playlist.controller.js';

const router = express.Router();
router.get('/', playlistController.renderLanding);
router.get('/p/:slug', asyncHandler(playlistController.renderPlaylist));
export default router;
