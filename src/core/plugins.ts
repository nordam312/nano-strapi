/**
 * The plugin system — the "data → behavior" conversion.
 *
 * Plugins are defined as plain DATA (see types.ts `Plugin`). This module is
 * the loader that COLLECTS that data into the container so it becomes usable,
 * exactly like Strapi's loadPlugins() (loaders/plugins/index.ts).
 *
 * What the loader does for each plugin:
 *   1. store the plugin in a registry (so we can list/inspect plugins)
 *   2. register every controller into the container under a namespaced key
 *      `controller.<plugin>.<name>`  (e.g. "controller.articles.article")
 *   3. register every service the same way: `service.<plugin>.<name>`
 *   4. run the plugin's own register()/bootstrap() lifecycle hooks
 *
 * After loading, `getController(app, 'articles.article')` resolves a string
 * to the real, instantiated controller — the same trick that lets a route's
 * `handler: 'article.find'` string find its function.
 */

import type { App } from './app.js';
import type { Plugin, Provider, Controller, ControllerFactory, ServiceFactory } from './types.js';

/** A tiny registry that just holds loaded plugins by name. */
export class PluginRegistry {
  private plugins = new Map<string, Plugin>();

  add(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already loaded.`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  all(): Plugin[] {
    return [...this.plugins.values()];
  }
}

/**
 * Resolve a "<plugin>.<controller>" string to the real controller object.
 * Mirrors Strapi's getController in compose-endpoint.ts — the lookup that
 * turns a route handler string into a function.
 */
export function getController(app: App, uid: string): Controller {
  return app.get<Controller>(`controller.${uid}`);
}

/** Resolve a "<plugin>.<service>" string to the real service object. */
export function getService<T = Record<string, unknown>>(app: App, uid: string): T {
  return app.get<T>(`service.${uid}`);
}

/**
 * Build the plugins Provider. Pass in the plugin definitions (plain data);
 * the returned provider plugs into the app lifecycle and loads them.
 *
 * This is how Strapi wires it too: the `registries` provider's register()
 * calls loadApplicationContext() → loadPlugins() (registries.ts:28).
 */
export function createPluginsProvider(definitions: Plugin[]): Provider {
  return {
    name: 'plugins',

    register(app) {
      // Create the registry service (the empty "box") and fill it.
      const registry = new PluginRegistry();
      app.add('plugins', () => registry);

      for (const plugin of definitions) {
        registry.add(plugin);

        // Register each controller factory under a namespaced key.
        for (const [name, factory] of Object.entries(plugin.controllers ?? {})) {
          registerNamespaced(app, 'controller', plugin.name, name, factory);
        }
        // Register each service factory the same way.
        for (const [name, factory] of Object.entries(plugin.services ?? {})) {
          registerNamespaced(app, 'service', plugin.name, name, factory);
        }
      }

      // Run each plugin's own register() hook (like runPluginsLifecycles).
      return runHook(app, definitions, 'register');
    },

    bootstrap(app) {
      // Run each plugin's own bootstrap() hook.
      return runHook(app, definitions, 'bootstrap');
    },
  };
}

// --- helpers ---------------------------------------------------------------

function registerNamespaced(
  app: App,
  kind: 'controller' | 'service',
  pluginName: string,
  name: string,
  factory: ControllerFactory | ServiceFactory
): void {
  // Container factories receive the app, so the controller/service can
  // resolve its own dependencies (e.g. a controller pulling its service).
  app.add(`${kind}.${pluginName}.${name}`, (a) => factory(a));
}

async function runHook(
  app: App,
  plugins: Plugin[],
  hook: 'register' | 'bootstrap'
): Promise<void> {
  for (const plugin of plugins) {
    await plugin[hook]?.(app);
  }
}
