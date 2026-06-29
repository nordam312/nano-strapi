import { describe, it, expect } from 'vitest';
import { Router } from '../router.js';
import type { Middleware } from '../compose.js';

// A no-op middleware to register; we only assert matching/params here.
const noop: Middleware = async () => {};

describe('Router', () => {
  it('matches a static path and method', () => {
    const r = new Router();
    r.register('GET', '/articles', [noop]);

    const match = r.match('GET', '/articles');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });

  it('returns null when the method differs', () => {
    const r = new Router();
    r.register('GET', '/articles', [noop]);

    expect(r.match('POST', '/articles')).toBeNull();
  });

  it('returns null when no path matches', () => {
    const r = new Router();
    r.register('GET', '/articles', [noop]);

    expect(r.match('GET', '/nope')).toBeNull();
  });

  it('extracts a :param from the path', () => {
    const r = new Router();
    r.register('GET', '/articles/:id', [noop]);

    const match = r.match('GET', '/articles/42');
    expect(match?.params).toEqual({ id: '42' });
  });

  it('does not let a :param match across path segments', () => {
    const r = new Router();
    r.register('GET', '/articles/:id', [noop]);

    // "/articles/1/comments" must NOT match "/articles/:id"
    expect(r.match('GET', '/articles/1/comments')).toBeNull();
  });

  it('lists registered routes', () => {
    const r = new Router();
    r.register('GET', '/a', [noop]);
    r.register('POST', '/b', [noop]);

    expect(r.list()).toEqual([
      { method: 'GET', path: '/a' },
      { method: 'POST', path: '/b' },
    ]);
  });
});
