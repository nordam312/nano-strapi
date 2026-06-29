import { describe, it, expect, beforeEach } from 'vitest';
import { App } from '../app.js';
import { createPluginsProvider } from '../plugins.js';
import { createRoutingProvider } from '../register-routes.js';
import { Router } from '../router.js';
import { compose } from '../compose.js';
import type { Context, Method } from '../types.js';
import articlesPlugin from '../../plugins/articles.js';

/**
 * Drive a request through the loaded app the same way the HTTP server does:
 * match the route, build a ctx, run the middleware chain. No real sockets.
 */
async function request(
  app: App,
  method: Method,
  path: string,
  opts: { body?: unknown; user?: string | null } = {}
): Promise<Context> {
  const router = app.get<Router>('router');
  const match = router.match(method, path);

  const ctx: Context = {
    method,
    path,
    params: match?.params ?? {},
    query: {},
    request: { body: opts.body ?? null }, // incoming payload
    body: null, // response body
    state: { user: opts.user ?? null },
    status: 200,
  };

  if (!match) {
    ctx.status = 404;
    ctx.body = { error: 'Not Found' };
    return ctx;
  }

  await compose(match.middlewares)(ctx);
  return ctx;
}

describe('App end-to-end (articles plugin)', () => {
  let app: App;

  beforeEach(async () => {
    // Fresh app per test → fresh in-memory store, full isolation.
    app = new App([createPluginsProvider([articlesPlugin]), createRoutingProvider()]);
    await app.load();
  });

  it('registers the plugin routes', () => {
    const router = app.get<Router>('router');
    expect(router.list()).toEqual([
      { method: 'GET', path: '/articles' },
      { method: 'POST', path: '/articles' },
      { method: 'GET', path: '/articles/:id' },
    ]);
  });

  it('GET /articles returns an empty list initially', async () => {
    const res = await request(app, 'GET', '/articles');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('blocks POST /articles with 403 when the policy fails (no user)', async () => {
    const res = await request(app, 'POST', '/articles', { body: { title: 'x' } });
    expect(res.status).toBe(403);
    // The article must NOT have been created (action short-circuited).
    const list = await request(app, 'GET', '/articles');
    expect(list.body).toEqual([]);
  });

  it('allows POST /articles when authenticated, then reads it back', async () => {
    const created = await request(app, 'POST', '/articles', {
      body: { title: 'Hello' },
      user: 'ada',
    });
    expect(created.status).toBe(200);
    expect(created.body).toEqual({ id: 1, title: 'Hello' });

    const list = await request(app, 'GET', '/articles');
    expect(list.body).toEqual([{ id: 1, title: 'Hello' }]);
  });

  it('resolves a :id param in GET /articles/:id', async () => {
    await request(app, 'POST', '/articles', { body: { title: 'First' }, user: 'ada' });

    const found = await request(app, 'GET', '/articles/1');
    expect(found.body).toEqual({ id: 1, title: 'First' });

    const missing = await request(app, 'GET', '/articles/999');
    expect(missing.body).toEqual({ error: 'Not found' });
  });

  it('returns 404 for an unknown route', async () => {
    const res = await request(app, 'GET', '/nope');
    expect(res.status).toBe(404);
  });
});
