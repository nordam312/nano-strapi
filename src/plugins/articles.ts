/**
 * Example plugin: "articles".
 *
 * Notice this file is just DATA + factory functions — it declares what the
 * plugin HAS (a service, a controller, lifecycle hooks). It never imports the
 * container or wires anything itself. The loader (core/plugins.ts) does that.
 *
 * This mirrors a real Strapi plugin's strapi-server entrypoint.
 */

import type { Plugin } from '../core/types.js';
import { getService } from '../core/plugins.js';

/** Shape of our article service, so the controller can be typed. */
interface ArticleService {
  findAll(): Article[];
  findOne(id: number): Article | undefined;
  create(data: { title: string }): Article;
}
interface Article {
  id: number;
  title: string;
}

const articlesPlugin: Plugin = {
  name: 'articles',

  // ROUTES = declarative DATA. `handler` is a "controller.action" string the
  // framework resolves to a function at boot — exactly like Strapi route files.
  routes: [
    { method: 'GET', path: '/articles', handler: 'article.find' },
    // Protected: the isAuthenticated policy must pass before create() runs.
    {
      method: 'POST',
      path: '/articles',
      handler: 'article.create',
      config: { policies: ['articles.isAuthenticated'] },
    },
    { method: 'GET', path: '/articles/:id', handler: 'article.findOne' },
  ],

  // POLICIES = guards. Return true to allow, false to block (→ 403).
  // This one passes only if the request carried a user (set from x-user header).
  policies: {
    isAuthenticated: (ctx) => Boolean(ctx.state.user),
  },

  // SERVICE = business logic. A factory receiving the app.
  // Here it owns an in-memory store (stands in for the database).
  services: {
    article: () => {
      const store: Article[] = [];
      return {
        findAll: () => store,
        findOne: (id: number) => store.find((a) => a.id === id),
        create: (data: { title: string }) => {
          const article = { id: store.length + 1, title: data.title };
          store.push(article);
          return article;
        },
      };
    },
  },

  // CONTROLLER = HTTP-facing glue. A factory receiving the app, so it can
  // resolve its OWN service via DI — never reaching into a global.
  controllers: {
    article: (app) => {
      // Resolve the sibling service by name (lazy; cached after first use).
      const service = getService<ArticleService>(app, 'articles.article');

      return {
        find: () => {
          return service.findAll();
        },
        findOne: (ctx) => {
          // Path param ":id" arrives as a string — parse it.
          const id = Number(ctx.params.id);
          return service.findOne(id) ?? { error: 'Not found' };
        },
        create: (ctx) => {
          const data = ctx.request.body as { title: string };
          return service.create(data);
        },
      };
    },
  },

  register() {
    console.log('  [plugin:articles] register hook');
  },
  bootstrap() {
    console.log('  [plugin:articles] bootstrap hook');
  },

  // -------------------------------------------------------------------------
  // ADMIN half — the client-side UI for this plugin. Pure DATA again: a menu
  // link, a reusable component, and pages. The pages fetch from the server
  // (the real full-stack loop) using Node's built-in fetch.
  // -------------------------------------------------------------------------
  admin: {
    menu: [{ to: '/articles', label: 'Articles' }],

    // A reusable UI component (a mini React component: props -> HTML).
    components: {
      ArticleCard: (props) =>
        `<div class="card"><strong>#${props?.id}</strong> ${props?.title}</div>`,
    },

    routes: [
      // List page: fetches all articles from the server and renders them.
      {
        path: '/articles',
        component: async ({ app }) => {
          const res = await fetch('http://localhost:1337/articles');
          const articles = (await res.json()) as Article[];
          const ArticleCard = app.getComponent('ArticleCard');

          const cards = articles.length
            ? articles.map((a) => ArticleCard({ id: a.id, title: a.title })).join('\n')
            : '<p>No articles yet.</p>';

          return `<h1>Articles</h1>\n${cards}`;
        },
      },
      // Detail page: fetches a single article by the :id route param.
      {
        path: '/articles/:id',
        component: async ({ params }) => {
          const res = await fetch(`http://localhost:1337/articles/${params.id}`);
          const article = (await res.json()) as Article | { error: string };

          if ('error' in article) {
            return `<h1>Article ${params.id}</h1><p>Not found.</p>`;
          }
          return `<h1>${article.title}</h1><p>Article #${article.id}</p>`;
        },
      },
    ],
  },
};

export default articlesPlugin;
