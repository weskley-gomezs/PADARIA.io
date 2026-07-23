console.log("[SERVER] Entry point called (/server.ts)");
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './src/server/app';

async function startServer() {
  console.log("[SERVER] Starting dev/prod server...");
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log("[SERVER] Configuring Vite middleware (Development)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Configuring Static files (Production)");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Server running on http://localhost:${PORT}`);
  });
}

// Only start the server if we're not running as a Vercel function
if (!process.env.VERCEL) {
  console.log("[SERVER] VERCEL environment variable not found, starting server...");
  startServer();
} else {
  console.log("[SERVER] VERCEL environment variable detected, skipping app.listen()");
}

export default app;
