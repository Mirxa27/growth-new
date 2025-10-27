import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import routes from './routes';

// Load env from server/.env or repo root .env
(() => {
  const candidates = [
    path.resolve(__dirname, '../../.env'), // when running from src via ts-node
    path.resolve(__dirname, '../.env'),    // when compiled to dist
    path.resolve(__dirname, '../../../.env'), // repo root
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
})();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

