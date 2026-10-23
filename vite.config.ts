/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createOmdbProxy, parseKeys } from './api/_lib/omdbProxy.js';

/**
 * Mirrors the Vercel function at /api/omdb during `npm run dev` and `npm run preview`,
 * so the app works locally without the Vercel CLI. Keys come from .env (OMDB_API_KEYS).
 */
function omdbDevProxy(keys: string[]): Plugin {
  const handle = createOmdbProxy({ keys });
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/omdb')) return next();
    const { searchParams } = new URL(req.url, 'http://localhost');
    const result = await handle(searchParams);
    res.writeHead(result.status, result.headers);
    res.end(JSON.stringify(result.body));
  };
  return {
    name: 'omdb-dev-proxy',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), omdbDevProxy(parseKeys(env.OMDB_API_KEYS))],
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    },
  };
});
