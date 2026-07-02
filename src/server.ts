/**
 * SERVER entry (Node backend). Run with: `npm run dev:server`.
 *
 * This is the strapi-server side: it boots the App (register → bootstrap →
 * listen) and seeds a little data. It imports ONLY server plugin halves — no
 * React, no browser code. The admin runs as a separate process (Vite).
 */
import { App } from './core/app.js';
import { createPluginsProvider } from './core/plugins.js';
import { createRoutingProvider } from './core/register-routes.js';
import articlesPlugin from './plugins/articles.js';
import usersPlugin from './plugins/users.js';

const BASE = 'http://localhost:1337';

async function main() {
  const app = new App([
    createPluginsProvider([articlesPlugin, usersPlugin]),
    createRoutingProvider(),
  ]);

  await app.start(1337);

  // Seed a couple of articles through the API (POST needs the x-user "auth").
  // Ignore errors if they already exist from a previous run.
  try {
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
  } catch {
    /* seeding is best-effort */
  }

  console.log('\nAPI ready. Start the admin with:  npm run dev:admin');
}

main();
