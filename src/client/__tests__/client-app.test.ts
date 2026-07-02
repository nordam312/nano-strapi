import { describe, it, expect } from 'vitest';

import { ClientApp } from '../client-app.js';
import type { AdminPlugin } from '../types.js';

// A no-op component stands in for a real React component.
const Noop = () => null;

describe('ClientApp', () => {
  it('collects menu, components and pages during register', async () => {
    const plugin: AdminPlugin = {
      name: 'demo',
      menu: [{ to: '/demo', label: 'Demo' }],
      components: { Widget: Noop },
      routes: [{ path: '/demo', component: Noop }],
    };

    const app = new ClientApp([plugin]);
    await app.register();

    expect(app.menu).toEqual([{ to: '/demo', label: 'Demo' }]);
    expect(app.getComponent('Widget')).toBe(Noop);
    expect(app.pages.map((p) => p.path)).toEqual(['/demo']);
  });

  it('lets one plugin inject a component into another plugin zone', async () => {
    const Injected = () => null;

    // This plugin owns no pages — it only injects into a shared zone.
    const injector: AdminPlugin = {
      name: 'injector',
      register(app) {
        app.injectComponent('articles.list.actions', Injected);
      },
    };

    const app = new ClientApp([injector]);
    await app.register();

    expect(app.getInjectedComponents('articles.list.actions')).toEqual([Injected]);
    // Unknown zones are simply empty (safe to render nothing).
    expect(app.getInjectedComponents('unknown.zone')).toEqual([]);
  });

  it('collects settings pages from multiple plugins', async () => {
    const a: AdminPlugin = {
      name: 'a',
      settings: [{ path: 'a', label: 'A', component: Noop }],
    };
    const b: AdminPlugin = {
      name: 'b',
      settings: [{ path: 'b', label: 'B', component: Noop }],
    };

    const app = new ClientApp([a, b]);
    await app.register();

    expect(app.settings.map((s) => s.path)).toEqual(['a', 'b']);
  });
});
