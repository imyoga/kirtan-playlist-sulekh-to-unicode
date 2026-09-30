import express from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import * as groupController from '../../controllers/group.controller.js';

const router = express.Router();

router.patch('/:id', asyncHandler(groupController.updateGroup));
router.delete('/:id', asyncHandler(groupController.deleteGroup));
router.put('/:id/items/positions', asyncHandler(groupController.reorderGroupItems));

export default router;
