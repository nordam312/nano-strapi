/**
 * nano-strapi entry point.
 *
 * Build the app from providers (plugins, then routing), then start it.
 * This is the equivalent of `createStrapi(...).start()`.
 */
import { App } from './core/app.js';
import { createPluginsProvider } from './core/plugins.js';
import { createRoutingProvider } from './core/register-routes.js';
import { Router } from './core/router.js';
import articlesPlugin from './plugins/articles.js';
import usersPlugin from './plugins/users.js';

async function main() {
  // Adding a whole feature = adding one plugin to this array. Nothing else changes.
  const app = new App([
    createPluginsProvider([articlesPlugin, usersPlugin]),
    createRoutingProvider(),
  ]);

  await app.start(1337);

  // Print the route table so it's clear what's available.
  const router = app.get<Router>('router');
  console.log('\nRoutes:');
  for (const r of router.list()) {
    console.log(`  ${r.method.padEnd(4)} ${r.path}`);
  }
  console.log('\nTry:');
  console.log('  curl localhost:1337/articles');
  console.log('  curl -X POST localhost:1337/articles -d \'{"title":"hi"}\'        # 403');
  console.log('  curl -X POST localhost:1337/articles -H "x-user: ada" -d \'{"title":"hi"}\'  # 201-ish');
}

main();
