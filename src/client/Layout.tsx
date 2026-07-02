/**
 * Layout — the admin app shell. A sidebar built from the menu registry plus an
 * <Outlet/> where the matched page renders. This is the nano equivalent of the
 * admin's layout that wraps every page (sidebar + main content area).
 */

import { Link, Outlet } from 'react-router-dom';

import type { MenuItem } from './types.js';

export function Layout({ menu, hasSettings }: { menu: MenuItem[]; hasSettings?: boolean }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav
        style={{
          width: 200,
          padding: 16,
          background: '#1c1e2b',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <strong style={{ fontSize: 18, marginBottom: 12 }}>nano-strapi</strong>
        {menu.map((item) => (
          <Link key={item.to} to={item.to} style={{ color: '#c3c8ff', textDecoration: 'none' }}>
            {item.label}
          </Link>
        ))}
        {hasSettings && (
          <Link
            to="/settings"
            style={{ color: '#c3c8ff', textDecoration: 'none', marginTop: 'auto' }}
          >
            ⚙ Settings
          </Link>
        )}
      </nav>

      <main style={{ flex: 1, padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}
