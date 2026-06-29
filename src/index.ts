/**
 * Temporary playground to test each stage as we build it.
 * (Later this becomes the real framework entry point.)
 */
import { App } from './core/app.js';
import { createPluginsProvider } from './core/plugins.js';
import { createRoutingProvider } from './core/register-routes.js';
import { Router } from './core/router.js';
import type { Context, Method } from './core/types.js';
import articlesPlugin from './plugins/articles.js';

console.log('=== Stage 4: Router demo ===\n');

/**
 * Simulate an HTTP request WITHOUT a real server (that comes in Stage 5).
 * This is what the HTTP server will do internally: match → build ctx → run.
 */
async function request(app: App, method: Method, path: string, body: unknown = null) {
  const router = app.get<Router>('router');
  const match = router.match(method, path);

  if (!match) {
    return { status: 404, body: 'Not Found' };
  }

  // Build the context the controller will read from.
  const ctx: Context = { params: match.params, query: {}, body, state: {} };
  const result = await match.handler(ctx);
  return { status: 200, body: result };
}

async function main() {
  // Providers run in order: plugins load first, THEN routes are registered.
  const app = new App([createPluginsProvider([articlesPlugin]), createRoutingProvider()]);

  await app.load();

  // 1) Show the compiled route table.
  const router = app.get<Router>('router');
  console.log('\n1) Registered route table:');
  for (const r of router.list()) {
    console.log(`   ${r.method.padEnd(4)} ${r.path}`);
  }

  // 2) Fire requests through the router.
  console.log('\n2) Dispatching requests:\n');

  console.log('   GET  /articles         →', await request(app, 'GET', '/articles'));
  console.log(
    '   POST /articles         →',
    await request(app, 'POST', '/articles', { title: 'Hello router' })
  );
  console.log(
    '   POST /articles         →',
    await request(app, 'POST', '/articles', { title: 'Second post' })
  );
  console.log('   GET  /articles         →', await request(app, 'GET', '/articles'));
  console.log('   GET  /articles/2       →', await request(app, 'GET', '/articles/2'));
  console.log('   GET  /articles/99      →', await request(app, 'GET', '/articles/99'));
  console.log('   GET  /nope             →', await request(app, 'GET', '/nope'));
}

main();
