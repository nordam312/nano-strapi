/**
 * SettingsLayout — the shell for the /settings area. A sub-menu (built from the
 * settings registry that plugins filled) on the left, and an <Outlet/> for the
 * active settings page. Mirrors Strapi's settings layout with its own nav.
 */

import { Link, Outlet } from 'react-router-dom';

import type { SettingsPage } from './types.js';

export function SettingsLayout({ pages }: { pages: SettingsPage[] }) {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <div style={{ display: 'flex', gap: 32 }}>
        <aside style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pages.map((page) => (
            <Link key={page.path} to={`/settings/${page.path}`} style={{ color: '#4945ff' }}>
              {page.label}
            </Link>
          ))}
        </aside>
        <section style={{ flex: 1 }}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}
