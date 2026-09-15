import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import riderRoutes from './routes/rider.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/riders', riderRoutes);

// Central error handler — always JSON, never leak stack traces in production.
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const start = async () => {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[server] Okada Connect API listening on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
