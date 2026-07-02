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

async function renderAdmin() {
  const app = new ClientApp([articlesAdmin]);

  await app.register(); // collect plugin menu/pages/components
  await app.bootstrap(); // wire up

  const mountNode = document.getElementById('root');
  if (!mountNode) throw new Error('Could not find #root to mount the admin');

  createRoot(mountNode).render(app.render());
}

renderAdmin();
