/**
 * ADMIN entry (browser). Loaded by index.html, served by Vite (`npm run dev:admin`).
 *
 * This is the strapi-admin side. It builds the ClientApp from the admin plugin
 * halves, runs the lifecycle, and mounts the result — the exact shape of
 * Strapi's renderAdmin(): new StrapiApp(...) → register → bootstrap → createRoot.
 */
import { createRoot } from 'react-dom/client';

import { ClientApp } from '../client/client-app.js';
import articlesAdmin from '../plugins/articles.admin.js';
import exportAdmin from '../plugins/export.admin.js';

async function renderAdmin() {
  // The export plugin injects UI into the articles page — order doesn't matter,
  // they're decoupled. Add or remove a plugin here; nothing else changes.
  const app = new ClientApp([articlesAdmin, exportAdmin]);

  await app.register(); // collect plugin menu/pages/components
  await app.bootstrap(); // wire up

  const mountNode = document.getElementById('root');
  if (!mountNode) throw new Error('Could not find #root to mount the admin');

  createRoot(mountNode).render(app.render());
}

renderAdmin();
