import path from 'node:path';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errors.js';
import routes from './routes/index.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_URL.split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve('uploads')));
app.use(
  '/api',
  rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }),
  routes
);
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'careerpilot-api', timestamp: new Date().toISOString() })
);
app.use(notFound);
app.use(errorHandler);
