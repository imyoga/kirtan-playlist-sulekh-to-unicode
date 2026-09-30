import 'dotenv/config';
import app from './src/app.js';
import config from './src/config/index.js';
import { initDb, closeDb } from './db.js';

async function startServer() {
  await initDb();
  const server = app.listen(config.port, () => {
    console.log(`Kirtan playlist server on http://localhost:${config.port}`);
  });
  const shutdown = async () => {
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
