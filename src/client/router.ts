/**
 * ClientRouter — matches a URL path to an admin page.
 *
 * This is the browser-side counterpart of the server Router. The server router
 * matches method + path to a middleware chain; this one matches path to a page
 * component (like @strapi/admin's RouterProvider mapping URLs to pages).
 */

import type { Page } from '../core/types.js';

interface PageEntry {
  path: string;
  regex: RegExp;
  paramNames: string[];
  page: Page;
}

export interface PageMatch {
  page: Page;
  params: Record<string, string>;
}

/** Compile "/articles/:id" to a regex + the param names (["id"]). */
function compilePath(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const source = pattern.replace(/:[^/]+/g, (segment) => {
    paramNames.push(segment.slice(1));
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}$`), paramNames };
}

export class ClientRouter {
  private entries: PageEntry[] = [];

  add(path: string, page: Page): void {
    const { regex, paramNames } = compilePath(path);
    this.entries.push({ path, regex, paramNames, page });
  }

  match(path: string): PageMatch | null {
    for (const entry of this.entries) {
      const m = entry.regex.exec(path);
      if (!m) continue;

      const params: Record<string, string> = {};
      entry.paramNames.forEach((name, i) => {
        params[name] = m[i + 1];
      });

      return { page: entry.page, params };
    }
    return null;
  }

  list(): string[] {
    return this.entries.map((e) => e.path);
  }
}
