/**
 * compose() — the onion middleware pattern, from scratch.
 *
 * This is our own implementation of `koa-compose` (the exact function Strapi
 * uses at compose-endpoint.ts:85). It takes a list of middleware and folds
 * them into ONE function. Each middleware receives `next` — calling it runs
 * the next middleware inward; code after `await next()` runs on the way out.
 *
 *   mw1 ─ before ──► mw2 ─ before ──► mw3(action)
 *   mw1 ◄─ after ─── mw2 ◄─ after ───┘
 *
 * If a middleware does NOT call next(), the chain stops there — nothing
 * deeper runs. That's how auth/policies block a request (short-circuit).
 */

import type { Context } from './types.js';

/** A middleware: do work, optionally call next() to continue inward. */
export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

export function compose(middlewares: Middleware[]): (ctx: Context) => Promise<void> {
  return function run(ctx: Context): Promise<void> {
    // Tracks the furthest middleware reached, to catch a double next() call.
    let lastCalled = -1;

    function dispatch(i: number): Promise<void> {
      if (i <= lastCalled) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      lastCalled = i;

      const fn = middlewares[i];
      if (!fn) return Promise.resolve(); // reached the end of the chain

      try {
        // Give this middleware a `next` that dispatches the FOLLOWING one.
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}
