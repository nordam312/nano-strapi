/**
 * The HTTP server — the nano version of Strapi's Koa server.
 *
 * For each incoming request it:
 *   1. builds a `ctx` from the Node req (method, path, query, body, headers)
 *   2. matches the route in the Router
 *   3. composes [globalMiddleware, ...routeChain] and runs it (the onion)
 *   4. writes ctx.status + ctx.body back as JSON
 *
 * Zero web framework — just Node's built-in `http` plus our own compose().
 */

import http from 'node:http';
import type { App } from './app.js';
import type { Context, Method } from './types.js';
import { compose, type Middleware } from './compose.js';
import { Router } from './router.js';

/** Read the request body and parse it as JSON (null if empty/invalid). */
function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(null);
      }
    });
  });
}

/** Build our framework ctx from a raw Node request. */
async function buildContext(req: http.IncomingMessage): Promise<Context> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const body = await readJsonBody(req);

  // A toy "auth": treat an `x-user` header as the logged-in user.
  // (A real app verifies a JWT here — this just demonstrates the flow.)
  const user = (req.headers['x-user'] as string | undefined) ?? null;

  return {
    method: (req.method ?? 'GET') as Method,
    path: url.pathname,
    params: {},
    query: Object.fromEntries(url.searchParams),
    request: { body }, // incoming payload
    body: null, // response body — filled by the controller's return value
    state: { user },
    status: 200,
  };
}

/** A global logger middleware — demonstrates the onion's before/after halves. */
const logger: Middleware = async (ctx, next) => {
  const start = Date.now();
  await next(); // ← everything inward runs here
  const ms = Date.now() - start;
  console.log(`  ${ctx.method} ${ctx.path} → ${ctx.status} (${ms}ms)`);
};

export function createServer(app: App): http.Server {
  const router = app.get<Router>('router');

  return http.createServer(async (req, res) => {
    const ctx = await buildContext(req);

    const match = router.match(ctx.method, ctx.path);

    // Build the full chain: global middleware first, then the route's chain.
    const chain: Middleware[] = [logger];
    if (match) {
      ctx.params = match.params;
      chain.push(...match.middlewares);
    } else {
      // No route → terminal 404 middleware.
      chain.push(async (c) => {
        c.status = 404;
        c.body = { error: 'Not Found' };
      });
    }

    try {
      await compose(chain)(ctx);
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: 'Internal Server Error' };
      console.error('  [500]', err);
    }

    res.statusCode = ctx.status;
    res.setHeader('content-type', 'application/json');
    // Allow the admin dev server (a different origin) to call the API.
    // A real framework does this via a configurable CORS middleware.
    res.setHeader('access-control-allow-origin', '*');
    res.end(JSON.stringify(ctx.body));
  });
}
