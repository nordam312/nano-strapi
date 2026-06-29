/**
 * register-routes — the "initRouting" step.
 *
 * After plugins are loaded, this walks every plugin's routes (DATA), composes
 * each into a callable handler, and registers it in the Router. Mirrors
 * Strapi's register-routes.ts, which runs during bootstrap (Strapi.ts:507).
 *
 * Note the ORDER guarantee: this is a separate provider placed AFTER the
 * plugins provider, so by the time its bootstrap runs, all plugins (and their
 * controllers) are already in the container — safe to resolve handlers.
 */

import type { App } from './app.js';
import type { Provider } from './types.js';
import { Router } from './router.js';
import { composeEndpoint } from './compose-endpoint.js';
import type { PluginRegistry } from './plugins.js';

function registerRoutes(app: App): Router {
  const router = new Router();
  const plugins = app.get<PluginRegistry>('plugins');

  for (const plugin of plugins.all()) {
    for (const route of plugin.routes ?? []) {
      // Tag the route with its plugin so the handler string can be resolved
      // (Strapi does the same: route.info = { pluginName }).
      route.info = { pluginName: plugin.name };

      // DATA → BEHAVIOR: resolve "article.find" to the real function now.
      const handler = composeEndpoint(app, route);

      router.register(route.method, route.path, handler);
    }
  }

  // Expose the router as a service so the HTTP server (Stage 5) can use it.
  app.add('router', () => router);
  return router;
}

/** Provider that builds the router during bootstrap. */
export function createRoutingProvider(): Provider {
  return {
    name: 'routing',
    bootstrap(app) {
      registerRoutes(app);
    },
  };
}
