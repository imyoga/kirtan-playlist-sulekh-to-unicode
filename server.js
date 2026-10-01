import 'dotenv/config';
import http from 'node:http';
import app from './src/app.js';
import config from './src/config/index.js';
import { initDb, closeDb } from './db.js';
import { initWebSocketServer, closeWebSocketServer } from './src/ws/server.js';

async function startServer() {
  await initDb();
  const server = http.createServer(app);
  initWebSocketServer(server);

  server.listen(config.port, () => {
    console.log(`Kirtan playlist server on http://localhost:${config.port}`);
  });
  const shutdown = async () => {
    closeWebSocketServer();
    server.close(async () => {
      await closeDb();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
