/**
 * Example plugin: "users".
 *
 * This plugin is completely independent of "articles" — separate routes,
 * controller, and service. Adding it to the app is a one-line change in
 * index.ts. That's the whole point of a plugin system: features are
 * self-contained units the framework composes, with zero coupling between them.
 */

import type { Plugin } from '../core/types.js';
import { getService } from '../core/plugins.js';

interface User {
  id: number;
  name: string;
}
interface UserService {
  list(): User[];
  add(data: { name: string }): User;
}

const usersPlugin: Plugin = {
  name: 'users',

  routes: [
    { method: 'GET', path: '/users', handler: 'user.find' },
    { method: 'POST', path: '/users', handler: 'user.create' },
  ],

  services: {
    user: () => {
      const store: User[] = [{ id: 1, name: 'Ada' }];
      return {
        list: () => store,
        add: (data: { name: string }) => {
          const user = { id: store.length + 1, name: data.name };
          store.push(user);
          return user;
        },
      };
    },
  },

  controllers: {
    user: (app) => {
      const service = getService<UserService>(app, 'users.user');
      return {
        find: () => service.list(),
        create: (ctx) => service.add(ctx.request.body as { name: string }),
      };
    },
  },
};

export default usersPlugin;
