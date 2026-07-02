import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite serves the admin (browser) app with hot-module reload (HMR) — the same
// dev experience Strapi's admin has. The backend runs as a separate process on
// :1337; the admin fetches from it directly (the server sends CORS headers).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
