import { describe, it, expect, vi } from 'vitest';
import { Container } from '../container.js';

describe('Container', () => {
  it('does not run a factory until the service is requested (lazy)', () => {
    const c = new Container();
    const factory = vi.fn(() => ({ ok: true }));

    c.register('thing', factory);
    expect(factory).not.toHaveBeenCalled(); // registering ≠ creating

    c.get('thing');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('caches the instance (singleton) — factory runs only once', () => {
    const c = new Container();
    const factory = vi.fn(() => ({ id: Math.random() }));
    c.register('thing', factory);

    const a = c.get('thing');
    const b = c.get('thing');

    expect(a).toBe(b); // same instance
    expect(factory).toHaveBeenCalledTimes(1); // not rebuilt
  });

  it('lets a factory resolve another service via the container', () => {
    const c = new Container();
    c.register('config', () => ({ port: 1337 }));
    c.register('server', (container) => {
      const config = container.get<{ port: number }>('config');
      return { url: `http://localhost:${config.port}` };
    });

    expect(c.get<{ url: string }>('server').url).toBe('http://localhost:1337');
  });

  it('throws when getting an unregistered service', () => {
    const c = new Container();
    expect(() => c.get('missing')).toThrow(/not registered/);
  });

  it('throws when registering the same name twice', () => {
    const c = new Container();
    c.register('dup', () => 1);
    expect(() => c.register('dup', () => 2)).toThrow(/already registered/);
  });
});
