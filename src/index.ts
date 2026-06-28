/**
 * Temporary playground to test each stage as we build it.
 * (Later this becomes the real framework entry point.)
 */
import { App } from './core/app.js';
import { createPluginsProvider, getController, PluginRegistry } from './core/plugins.js';
import type { Context } from './core/types.js';
import articlesPlugin from './plugins/articles.js';

console.log('=== Stage 3: Plugin loader demo ===\n');

// Helper to fake a request context for testing controllers directly.
const ctx = (body: unknown = null): Context => ({
  params: {},
  query: {},
  body,
  state: {},
});

async function main() {
  // The app is built from providers. The plugins provider carries our plugin
  // definitions (plain data) and loads them during the lifecycle.
  const app = new App([createPluginsProvider([articlesPlugin])]);

  await app.load();

  // 1) The registry collected our plugin.
  const plugins = app.get<PluginRegistry>('plugins');
  console.log('\n1) Loaded plugins:', plugins.all().map((p) => p.name));

  // 2) Resolve a controller from a STRING — this is the key trick.
  console.log('\n2) Resolving controller "articles.article" from a string...');
  const articleController = getController(app, 'articles.article');
  console.log('   -> got controller with actions:', articleController.find(ctx()));

  // 3) Call its actions. The controller uses its service via DI internally.
  console.log('\n3) Calling actions:');
  console.log('   find() (empty):', articleController.find(ctx()));
  console.log('   create({title}):', articleController.create(ctx({ title: 'Hello nano-strapi' })));
  console.log('   create({title}):', articleController.create(ctx({ title: 'Second post' })));
  console.log('   find() (now):', articleController.find(ctx()));
}

main();
