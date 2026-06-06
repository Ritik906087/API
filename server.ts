import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import worker from './src/worker.js';

// Load local environmental secrets and variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Intercept requests to '/' and '/api/*' for our worker backend emulation
  app.all(['/', '/api/*'], express.raw({ type: '*/*' }), async (req, res) => {
    try {
      const protocol = req.protocol;
      const host = req.get('host') || 'localhost:3000';
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;
      
      // Construct standard W3C Fetch Options
      const requestOptions: RequestInit = {
        method: req.method,
        headers: new Headers(req.headers as Record<string, string>),
      };

      // Pass the payload body for non-GET requests if size is greater than zero
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Buffer.isBuffer(req.body) && req.body.length > 0) {
        requestOptions.body = req.body;
      }

      // Initialize Fetch Request instance
      const w3cReq = new Request(fullUrl, requestOptions);

      // Emulate Cloudflare Environment Secrets Bindings from local system environment
      const workerEnv = {
        MONGODB_URI: process.env.MONGODB_URI,
        MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
        SUPABASE_URL: process.env.SUPABASE_URL || process.env.SB_PROJECT_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.SB_PUBLISHABLE_KEY,
        SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || process.env.SB_SECRET_KEY,
        SB_PROJECT_URL: process.env.SB_PROJECT_URL,
        SB_PUBLISHABLE_KEY: process.env.SB_PUBLISHABLE_KEY,
        SB_SECRET_KEY: process.env.SB_SECRET_KEY,
      };

      // Stream the call directly into our exported Cloudflare Worker Fetch handler
      const workerResponse = await worker.fetch(w3cReq, workerEnv);

      // Map the status and headers back to Express response stream
      res.status(workerResponse.status);
      
      workerResponse.headers.forEach((value, key) => {
        // Avoid duplicate or restricted headers mapped back dynamically
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });

      // Read responses streams efficiently
      if (workerResponse.body) {
        const reader = workerResponse.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      
      res.end();
    } catch (error) {
      console.error("Local Cloudflare Worker Emulation Gateway Exception:", error);
      res.status(500).json({
        error: "Isolate Gateway Emulation Error",
        message: error instanceof Error ? error.message : "Internal exception in local wrangler emulator server."
      });
    }
  });

  // Setup Vite middleware in local development or express.static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to host 0.0.0.0 and Port 3000 for standard Cloud Run routing access and visual sandbox rendering
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`================================================================`);
    console.log(`⚡ CLOUDFLARE WORKER LOCAL EMULATOR READY`);
    console.log(`📡 Local Gateway Port: 3000 (0.0.0.0)`);
    console.log(`📝 Sandbox API Portal: http://localhost:3000/`);
    console.log(`================================================================`);
  });
}

startServer();

