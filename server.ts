import 'dotenv/config';
console.log("[SERVER] Entry point called (/server.ts)");
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import app from './api/index';
import { CLUSTER_PAGES, ARTICLES_DATA } from './src/data/seoData';

async function startServer() {
  console.log("[SERVER] Starting dev/prod server...");
  const PORT = 3000;

  // Helper to inject SEO tags into raw index.html for bots & SSR fallback
  const getInjectedHtml = (originalHtml: string, reqPath: string) => {
    let title = 'Software para Padarias | Controle de Estoque, Perdas e Validades | Padaria.io';
    let description = 'Software para padarias focado em controle de estoque de insumos e perecíveis, auditoria de perdas por foto, controle de validade preventivo e resolução de divergências.';
    let canonical = `https://padaria.io${reqPath === '/' ? '' : reqPath}`;

    const clean = reqPath.replace(/^\//, '').replace(/\/$/, '');

    if (CLUSTER_PAGES[clean]) {
      const p = CLUSTER_PAGES[clean];
      title = p.title;
      description = p.metaDescription;
      canonical = p.url;
    } else if (reqPath.startsWith('/conteudos/')) {
      const artSlug = reqPath.replace('/conteudos/', '').replace(/\/$/, '');
      if (ARTICLES_DATA[artSlug]) {
        const a = ARTICLES_DATA[artSlug];
        title = a.title;
        description = a.metaDescription;
        canonical = a.url;
      }
    } else if (reqPath === '/conteudos' || reqPath === '/conteudos/') {
      title = 'Centro de Conteúdos e Guias para Padarias | Padaria.io';
      description = 'Aprenda a controlar estoque de farinhas e frios, reduzir desperdício de fornadas, evitar multas sanitárias e zerar divergências na sua padaria.';
      canonical = 'https://padaria.io/conteudos';
    }

    let modified = originalHtml;
    // Replace <title>
    modified = modified.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    // Replace description
    modified = modified.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
    // Replace canonical
    modified = modified.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`);
    // Replace og:title & og:description
    modified = modified.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
    modified = modified.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
    modified = modified.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonical}" />`);

    return modified;
  };

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
    const indexHtmlPath = path.join(distPath, 'index.html');
    let cachedHtml = '';

    try {
      if (fs.existsSync(indexHtmlPath)) {
        cachedHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
      }
    } catch (e) {
      console.warn('[SERVER] Could not load cached index.html', e);
    }

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      if (cachedHtml) {
        const enrichedHtml = getInjectedHtml(cachedHtml, req.path);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(enrichedHtml);
      } else {
        res.sendFile(indexHtmlPath);
      }
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
