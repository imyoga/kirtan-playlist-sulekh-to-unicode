import express from 'express';
import apiRoutes from './api/index.js';
import pageRoutes from './page.routes.js';

const router = express.Router();
router.use('/api', apiRoutes);
router.use(pageRoutes);
export default router;
