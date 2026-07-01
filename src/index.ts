/**
 * nano-strapi entry point — now FULL-STACK.
 *
 * 1. Start the SERVER (backend): createApp(...).start() — register → bootstrap → listen.
 * 2. Seed some data through the API.
 * 3. Build the CLIENT (admin): new ClientApp(...) → register → bootstrap.
 * 4. Render admin pages that FETCH from the running server (the real loop).
 *
 * The same plugins power both halves — that's the server/admin split.
 */
import { writeFile, mkdir } from 'node:fs/promises';

import { App } from './core/app.js';
import { createPluginsProvider } from './core/plugins.js';
import { createRoutingProvider } from './core/register-routes.js';
import { ClientApp } from './client/client-app.js';
import articlesPlugin from './plugins/articles.js';
import usersPlugin from './plugins/users.js';
import type { Server } from 'node:http';

const plugins = [articlesPlugin, usersPlugin];
const BASE = 'http://localhost:1337';

async function main() {
  // === BACKEND ===========================================================
  const app = new App([createPluginsProvider(plugins), createRoutingProvider()]);
  await app.start(1337);

  // Seed a couple of articles through the API (POST needs the x-user "auth").
  await fetch(`${BASE}/articles`, {
    method: 'POST',
    headers: { 'x-user': 'ada' },
    body: JSON.stringify({ title: 'Hello full-stack' }),
  });
  await fetch(`${BASE}/articles`, {
    method: 'POST',
    headers: { 'x-user': 'ada' },
    body: JSON.stringify({ title: 'Server + Admin, one framework' }),
  });

  // === FRONTEND (admin) ==================================================
  const client = new ClientApp(plugins);
  await client.register(); // collect each plugin's admin menu/pages/components
  await client.bootstrap();

  console.log('\nAdmin menu:', client.menu.map((m) => m.label));
  console.log('Admin routes:', client.listRoutes());

  // Render admin pages — each page fetches from the server we started above.
  const listHtml = await client.render('/articles');
  const detailHtml = await client.render('/articles/2');
  const notFoundHtml = await client.render('/nope');

  // Write them to disk so they can be opened in a browser.
  await mkdir('out', { recursive: true });
  await writeFile('out/articles.html', listHtml);
  await writeFile('out/article-2.html', detailHtml);

  console.log('\n=== Rendered /articles (fetched live from the server) ===');
  console.log(extractMain(listHtml));
  console.log('\n=== Rendered /articles/2 ===');
  console.log(extractMain(detailHtml));
  console.log('\n=== Rendered /nope (404) ===');
  console.log(extractMain(notFoundHtml));
  console.log('\nFull HTML written to out/articles.html — open it in a browser.');

  // Clean one-shot demo: close the server and exit.
  (app.get('server') as Server).close();
}

/** Pull just the <main>…</main> inner content out, for a tidy console log. */
function extractMain(html: string): string {
  const match = html.match(/<main>([\s\S]*?)<\/main>/);
  return (match?.[1] ?? html).trim();
}

main();
