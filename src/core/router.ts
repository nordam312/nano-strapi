/**
 * Router — stores registered endpoints and matches an incoming method+path
 * to one of them. This is the nano version of @koa/router.
 *
 * Each registered entry keeps a pre-compiled regex for its path so matching
 * is fast, plus the param names so we can extract values like :id.
 */

import type { Action, Method } from './types.js';

interface RouteEntry {
  method: Method;
  path: string; // original pattern, e.g. "/articles/:id" (for logging)
  regex: RegExp; // compiled matcher
  paramNames: string[]; // e.g. ["id"]
  handler: Action; // the composed endpoint (resolved at registration)
}

export interface MatchResult {
  handler: Action;
  params: Record<string, string>;
}

/**
 * Compile "/articles/:id" into a regex like /^\/articles\/([^/]+)$/
 * and collect the param names (["id"]).
 */
function compilePath(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const source = pattern.replace(/:[^/]+/g, (segment) => {
    paramNames.push(segment.slice(1)); // drop the ":"
    return '([^/]+)'; // capture one path segment
  });
  return { regex: new RegExp(`^${source}$`), paramNames };
}

export class Router {
  private entries: RouteEntry[] = [];

  /** Register one endpoint with its already-composed handler. */
  register(method: Method, path: string, handler: Action): void {
    const { regex, paramNames } = compilePath(path);
    this.entries.push({ method, path, regex, paramNames, handler });
  }

  /**
   * Find the handler for an incoming request and extract path params.
   * Returns null if nothing matches (→ 404 later).
   */
  match(method: Method, path: string): MatchResult | null {
    for (const entry of this.entries) {
      if (entry.method !== method) continue;

      const m = entry.regex.exec(path);
      if (!m) continue;

      // Build params object from capture groups.
      const params: Record<string, string> = {};
      entry.paramNames.forEach((name, i) => {
        params[name] = m[i + 1];
      });

      return { handler: entry.handler, params };
    }
    return null;
  }

  /** List registered routes (handy for a "route table" log). */
  list(): { method: Method; path: string }[] {
    return this.entries.map(({ method, path }) => ({ method, path }));
  }
}
