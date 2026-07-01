/**
 * ClientApp — the admin (client) application. The nano version of StrapiApp
 * (packages/core/admin/admin/src/StrapiApp.tsx).
 *
 * Just like the server `App` is a container with a lifecycle, ClientApp holds
 * the UI REGISTRIES (menu, components, pages) and runs the same lifecycle:
 *
 *   register()   ← each plugin's admin half drops its menu/components/pages in
 *   bootstrap()  ← plugins wire up once everything is registered
 *   render(path) ← assemble the matched page inside the app shell (the "layout")
 *
 * Compare to StrapiApp: register/bootstrap collect plugin UI, then render()
 * builds the store + router and returns <Providers><RouterProvider/></Providers>.
 * Here render() builds the menu + page and returns an HTML string.
 */

import { ClientRouter } from './router.js';
import type { Component, MenuItem, Page, Plugin } from '../core/types.js';

export class ClientApp {
  /** Sidebar menu items (like StrapiApp.menu). */
  menu: MenuItem[] = [];

  /** Reusable UI components by name (like StrapiApp.components / library). */
  components: Record<string, Component> = {};

  /** Maps URL paths to pages (like StrapiApp.router). */
  private router = new ClientRouter();

  private plugins: Plugin[];

  constructor(plugins: Plugin[]) {
    this.plugins = plugins;
  }

  // --- registry API (used by plugins during register) ----------------------
  addMenuItem(item: MenuItem): void {
    this.menu.push(item);
  }

  addComponent(name: string, component: Component): void {
    this.components[name] = component;
  }

  getComponent(name: string): Component {
    const component = this.components[name];
    if (!component) {
      throw new Error(`Admin component "${name}" is not registered.`);
    }
    return component;
  }

  addPage(path: string, page: Page): void {
    this.router.add(path, page);
  }

  // --- lifecycle -----------------------------------------------------------

  /** Phase 1: collect every plugin's admin declarations + run its register(). */
  async register(): Promise<this> {
    for (const plugin of this.plugins) {
      const admin = plugin.admin;
      if (!admin) continue;

      admin.menu?.forEach((item) => this.addMenuItem(item));
      for (const [name, component] of Object.entries(admin.components ?? {})) {
        this.addComponent(name, component);
      }
      admin.routes?.forEach((route) => this.addPage(route.path, route.component));

      await admin.register?.(this);
    }
    return this;
  }

  /** Phase 2: run every plugin's admin bootstrap(). */
  async bootstrap(): Promise<this> {
    for (const plugin of this.plugins) {
      await plugin.admin?.bootstrap?.(this);
    }
    return this;
  }

  /**
   * Render the app for a given URL path: match the page, run it, and wrap the
   * result in the app shell (sidebar menu + main content) — the equivalent of
   * StrapiApp wrapping the matched page in Providers + the layout.
   */
  async render(path: string): Promise<string> {
    const match = this.router.match(path);
    const content = match
      ? await match.page({ params: match.params, app: this })
      : `<h1>404 — Not Found</h1><p>No page for <code>${path}</code></p>`;

    return this.layout(content, path);
  }

  /** The app shell: a sidebar built from the menu registry + the page content. */
  private layout(content: string, activePath: string): string {
    const links = this.menu
      .map((item) => {
        const active = item.to === activePath ? ' aria-current="page"' : '';
        return `<a href="${item.to}"${active}>${item.label}</a>`;
      })
      .join('\n      ');

    return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>nano-strapi admin</title></head>
  <body>
    <nav class="sidebar">
      <strong>nano-strapi</strong>
      ${links}
    </nav>
    <main>
${content}
    </main>
  </body>
</html>`;
  }

  /** List registered page paths (for a route table log). */
  listRoutes(): string[] {
    return this.router.list();
  }
}
