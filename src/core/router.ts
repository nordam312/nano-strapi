/**
 * Router — stores registered endpoints and matches an incoming method+path
 * to one of them. This is the nano version of @koa/router.
 *
 * Each entry stores the route's MIDDLEWARE CHAIN (policies + action), built by
 * compose-endpoint. The HTTP server prepends global middleware and runs it.
 */

import type { Method } from './types.js';
import type { Middleware } from './compose.js';

interface RouteEntry {
  method: Method;
  path: string; // original pattern, e.g. "/articles/:id"
  regex: RegExp; // compiled matcher
  paramNames: string[]; // e.g. ["id"]
  middlewares: Middleware[]; // policies + action, composed by the server
}

export interface MatchResult {
  middlewares: Middleware[];
  params: Record<string, string>;
}

function compilePath(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const source = pattern.replace(/:[^/]+/g, (segment) => {
    paramNames.push(segment.slice(1));
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}$`), paramNames };
}

export class Router {
  private entries: RouteEntry[] = [];

  /** Register one endpoint with its middleware chain. */
  register(method: Method, path: string, middlewares: Middleware[]): void {
    const { regex, paramNames } = compilePath(path);
    this.entries.push({ method, path, regex, paramNames, middlewares });
  }

  /** Find the chain for an incoming request and extract path params. */
  match(method: Method, path: string): MatchResult | null {
    for (const entry of this.entries) {
      if (entry.method !== method) continue;

      const m = entry.regex.exec(path);
      if (!m) continue;

      const params: Record<string, string> = {};
      entry.paramNames.forEach((name, i) => {
        params[name] = m[i + 1];
      });

      return { middlewares: entry.middlewares, params };
    }
    return null;
  }

  list(): { method: Method; path: string }[] {
    return this.entries.map(({ method, path }) => ({ method, path }));
  }
}
