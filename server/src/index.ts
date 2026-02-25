import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/schema.js';
import { closeDb } from './db/connection.js';
import logsRouter from './routes/logs.js';
import alertsRouter from './routes/alerts.js';
import modelRouter from './routes/model.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

async function start() {
  await initializeDatabase();
  console.log('Database initialized');

  app.use('/api/logs', logsRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/model', modelRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const server = app.listen(PORT, () => {
    console.log(`RAA Server running on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log('\nShutting down...');
    closeDb();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(console.error);
