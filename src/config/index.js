import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  port: Number(process.env.PORT) || 3001,
  baseUrl: process.env.BASE_URL || '',
  publicDir: path.join(__dirname, '../../public'),
  nodeEnv: process.env.NODE_ENV || 'development',
};
