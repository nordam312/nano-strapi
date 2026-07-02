/**
 * ClientApp — the admin (client) application. The nano version of StrapiApp
 * (packages/core/admin/admin/src/StrapiApp.tsx).
 *
 * Holds the UI REGISTRIES (menu, components, pages) and runs the same lifecycle:
 *
 *   register()   ← each admin plugin drops its menu/components/pages in
 *   bootstrap()  ← plugins wire up once everything is registered
 *   render()     ← assemble everything into a React tree (RouterProvider)
 *
 * Compare to StrapiApp.render(): it builds the store + router from what plugins
 * registered and returns <RouterProvider/>. Ours does the same, minus Redux.
 */

import { createElement } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Layout } from './Layout.js';
import { AppContext } from './injection.js';
import type { AdminPlugin, Component, MenuItem, Page } from './types.js';

import type { ReactElement } from 'react';

export class ClientApp {
  /** Sidebar menu items (like StrapiApp.menu). */
  menu: MenuItem[] = [];

  /** Reusable UI components by name (like StrapiApp.components / library). */
  components: Record<string, Component> = {};

  /** Registered pages: path -> page component (like StrapiApp.router). */
  pages: { path: string; component: Page }[] = [];

  /** Components injected into named zones by plugins (the extension registry). */
  injectionZones: Record<string, Component[]> = {};

  private plugins: AdminPlugin[];

  constructor(plugins: AdminPlugin[]) {
    this.plugins = plugins;
  }

  // --- registry API (used by plugins during register) ----------------------
  addMenuItem(item: MenuItem): void {
    this.menu.push(item);
  }

  addComponent(name: string, component: Component): void {
    this.components[name] = component;
  }

  getComponent<T extends Component = Component>(name: string): T {
    const component = this.components[name];
    if (!component) {
      throw new Error(`Admin component "${name}" is not registered.`);
    }
    return component as T;
  }

  addPage(path: string, component: Page): void {
    this.pages.push({ path, component });
  }

  /** Inject a component into a named zone (used by plugins to extend pages). */
  injectComponent(zone: string, component: Component): void {
    (this.injectionZones[zone] ??= []).push(component);
  }

  /** Get all components injected into a zone (used by <InjectionZone/>). */
  getInjectedComponents(zone: string): Component[] {
    return this.injectionZones[zone] ?? [];
  }

  // --- lifecycle -----------------------------------------------------------

  /** Phase 1: collect every plugin's admin declarations + run its register(). */
  async register(): Promise<this> {
    for (const plugin of this.plugins) {
      plugin.menu?.forEach((item) => this.addMenuItem(item));
      for (const [name, component] of Object.entries(plugin.components ?? {})) {
        this.addComponent(name, component);
      }
      plugin.routes?.forEach((route) => this.addPage(route.path, route.component));

      await plugin.register?.(this);
    }
    return this;
  }

  /** Phase 2: run every plugin's admin bootstrap(). */
  async bootstrap(): Promise<this> {
    for (const plugin of this.plugins) {
      await plugin.bootstrap?.(this);
    }
    return this;
  }

  /**
   * Assemble the app into a React tree: build the router from the registered
   * pages, nested inside a Layout (sidebar built from the menu registry).
   * Mirrors StrapiApp.render() returning <RouterProvider/>.
   */
  render(): ReactElement {
    const router = createBrowserRouter([
      {
        path: '/',
        element: createElement(Layout, { menu: this.menu }),
        children: [
          // Redirect-ish default: send "/" to the first registered page.
          ...(this.pages.length
            ? [{ index: true, element: createElement(this.pages[0].component) }]
            : []),
          ...this.pages.map((page) => ({
            // react-router child paths are relative to the parent ("/"),
            // so strip a leading slash if the plugin wrote one.
            path: page.path.replace(/^\//, ''),
            element: createElement(page.component),
          })),
        ],
      },
    ]);

    // Provide the app via context so any component (e.g. InjectionZone) can
    // read the registries, then render the router. Equivalent JSX:
    //   <AppContext.Provider value={this}><RouterProvider router={router}/></AppContext.Provider>
    return createElement(
      AppContext.Provider,
      { value: this },
      createElement(RouterProvider, { router })
    );
  }
}
