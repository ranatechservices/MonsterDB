import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createApiRouter } from './src/server/apiRouter';
import { initPostgresDatabase } from './src/server/db/postgres';
import { testSupabaseConnection } from './src/server/services/supabaseService';

const app = express();
const PORT = 3000;

// Security & CORS Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: true,
  credentials: true
}));

// General API Rate Limiter (200 requests per 15 minutes window)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

app.use('/api', generalLimiter);

// Initialize Supabase / PostgreSQL database connection if configured
(async () => {
  try {
    await testSupabaseConnection();
    await initPostgresDatabase();
  } catch (err: any) {
    console.warn('Database boot notice:', err?.message || err);
  }
})();

// API routes FIRST
app.use('/api', createApiRouter());

app.get('/api/health/status', (_req: Request, res: Response) => {
  res.json({ status: 'operational', timestamp: new Date().toISOString(), database: 'active' });
});

// Serve static assets in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API route not found' });
    return;
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DHealora production server listening on port ${PORT}`);
});
