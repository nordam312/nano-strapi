import { describe, it, expect } from 'vitest';
import { compose, type Middleware } from '../compose.js';
import type { Context } from '../types.js';

// Minimal ctx factory for tests.
const ctx = (): Context => ({
  method: 'GET',
  path: '/',
  params: {},
  query: {},
  request: { body: null },
  body: null,
  state: {},
  status: 200,
});

describe('compose (onion middleware)', () => {
  it('runs middleware in onion order (before inward, after outward)', async () => {
    const order: string[] = [];

    const a: Middleware = async (_c, next) => {
      order.push('a:before');
      await next();
      order.push('a:after');
    };
    const b: Middleware = async (_c, next) => {
      order.push('b:before');
      await next();
      order.push('b:after');
    };
    const c: Middleware = async () => {
      order.push('c');
    };

    await compose([a, b, c])(ctx());

    expect(order).toEqual(['a:before', 'b:before', 'c', 'b:after', 'a:after']);
  });

  it('short-circuits: a middleware that does not call next() stops the chain', async () => {
    const order: string[] = [];

    const guard: Middleware = async (c) => {
      order.push('guard');
      c.status = 403; // block — note: no next()
    };
    const action: Middleware = async () => {
      order.push('action'); // should NEVER run
    };

    const context = ctx();
    await compose([guard, action])(context);

    expect(order).toEqual(['guard']); // action did not run
    expect(context.status).toBe(403);
  });

  it('rejects if next() is called more than once', async () => {
    const bad: Middleware = async (_c, next) => {
      await next();
      await next(); // illegal
    };

    await expect(compose([bad, async () => {}])(ctx())).rejects.toThrow(/multiple times/);
  });

  it('shares the same ctx across all middleware', async () => {
    const write: Middleware = async (c, next) => {
      c.state.user = 'ada';
      await next();
    };
    const read: Middleware = async (c) => {
      c.body = `hello ${c.state.user as string}`;
    };

    const context = ctx();
    await compose([write, read])(context);
    expect(context.body).toBe('hello ada');
  });
});
