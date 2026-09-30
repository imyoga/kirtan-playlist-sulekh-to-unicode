import express from 'express';
import config from './config/index.js';
import securityHeaders from './middleware/security.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();
app.use(securityHeaders);
app.use(express.json({ limit: '2mb' }));
app.use(express.static(config.publicDir, { index: false }));
app.use(routes);
app.use(errorHandler);
export default app;
