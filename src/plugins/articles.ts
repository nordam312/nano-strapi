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
  create(data: { title: string }): Article;
}
interface Article {
  id: number;
  title: string;
}

const articlesPlugin: Plugin = {
  name: 'articles',

  // SERVICE = business logic. A factory receiving the app.
  // Here it owns an in-memory store (stands in for the database).
  services: {
    article: () => {
      const store: Article[] = [];
      return {
        findAll: () => store,
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
        create: (ctx) => {
          const data = ctx.body as { title: string };
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
};

export default articlesPlugin;
