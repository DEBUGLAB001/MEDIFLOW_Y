import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Support DEBUG//LAB preview environment: /runtime/{runtime_id}/preview/
app.use((req, res, next) => {
  const match = req.url.match(/^\/runtime\/[^/]+\/preview(\/.*)?$/);
  if (match) {
    req.url = match[1] || '/';
  }
  next();
});

// API routes
app.use('/api', apiRouter);

// Static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediFlow Hospital Operations System active on http://0.0.0.0:${PORT}`);
  });
}

export default app;
