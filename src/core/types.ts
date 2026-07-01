/**
 * Shared type definitions for the framework.
 * (In Strapi these live in @strapi/types — the single source of truth.)
 */

import type { App } from './app.js';
import type { ClientApp } from '../client/client-app.js';

/**
 * A Provider is a small module that hooks into the app's lifecycle.
 * Each phase is optional. The app runs ALL providers' `register` first,
 * then ALL providers' `bootstrap`. This is exactly Strapi's provider
 * pattern (see packages/core/core/src/providers/).
 *
 * Why split register vs bootstrap?
 *   - register:  "introduce yourself / put your services in the container".
 *                Nothing should depend on OTHER providers being ready yet.
 *   - bootstrap: "everything is registered now — wire things up, connect DB,
 *                build routes". Safe to use other services here.
 */
export interface Provider {
  name: string;
  register?(app: App): void | Promise<void>;
  bootstrap?(app: App): void | Promise<void>;
}

/**
 * The request/response context passed through controllers (and, later,
 * middleware). This is a tiny version of Koa's `ctx`. A controller reads
 * params/query/body off it and writes its result to `body`.
 */
export interface Context {
  method: Method;
  path: string;
  params: Record<string, string>;
  query: Record<string, unknown>;
  request: { body: unknown }; // INCOMING request payload (read-only input)
  body: unknown; // OUTGOING response body (what the controller returns)
  state: Record<string, unknown>; // scratch space shared across middleware
  status: number; // response status code (defaults to 200)
}

/**
 * A Policy decides if a request may proceed. Returns true to allow,
 * false to block (→ 403). Mirrors Strapi's policies. Resolved by name
 * from a route's config.policies.
 */
export type Policy = (ctx: Context) => boolean | Promise<boolean>;

/** A single controller action — e.g. `find`, `create`. */
export type Action = (ctx: Context) => unknown | Promise<unknown>;

/** A controller is a bag of named actions. */
export type Controller = Record<string, Action>;

/**
 * Factory functions. Controllers and services are not plain objects —
 * they are FUNCTIONS that receive the app and return the object. This is
 * Strapi's factory pattern: createController(strapi) / createService(strapi).
 * It lets each controller/service resolve its own dependencies via app.get().
 */
export type ControllerFactory = (app: App) => Controller;
export type ServiceFactory = (app: App) => Record<string, unknown>;

/** HTTP methods we support. */
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Per-route config. `policies` and `middlewares` are just NAMES here —
 * declarative, like Strapi's route config. They get resolved to functions
 * in Stage 5 (the onion middleware). Empty/ignored until then.
 */
export interface RouteConfig {
  policies?: string[];
  middlewares?: string[];
}

/**
 * A Route is DATA describing one endpoint. The `handler` is a STRING
 * ("<controller>.<action>", e.g. "article.find") — the framework resolves
 * it to a real function at boot, exactly like Strapi's route files.
 */
export interface Route {
  method: Method;
  path: string;
  handler: string;
  config?: RouteConfig;
  /** Filled in by the loader so the handler string can be resolved. */
  info?: { pluginName: string };
}

// ---------------------------------------------------------------------------
// Admin / client-side types (the "admin" half of a plugin).
//
// These mirror Strapi's server/admin split: a plugin has a server half (routes,
// controllers, services above) AND an admin half (menu, pages, components). The
// server runs in Node; the admin runs in the "browser". Here the browser is
// simulated by rendering components to HTML strings (a tiny React), so the whole
// thing still runs in the terminal with zero dependencies.
// ---------------------------------------------------------------------------

/** A UI component: takes props, returns an HTML string. (A mini React.) */
export type Component = (props?: Record<string, unknown>) => string;

/** A link in the admin's sidebar menu. */
export interface MenuItem {
  to: string;
  label: string;
}

/** Context passed to a page when it renders (route params + the app). */
export interface PageContext {
  params: Record<string, string>;
  app: ClientApp;
}

/** A page: given route context, returns HTML. May be async (e.g. to fetch data). */
export type Page = (ctx: PageContext) => string | Promise<string>;

/** A declarative admin route: a path mapped to a page. */
export interface AdminRoute {
  path: string;
  component: Page;
}

/**
 * The admin (client) half of a plugin — declared as DATA, exactly like the
 * server half. Mirrors what a plugin registers into StrapiApp.
 */
export interface AdminPlugin {
  menu?: MenuItem[];
  routes?: AdminRoute[];
  components?: Record<string, Component>;
  register?(app: ClientApp): void | Promise<void>;
  bootstrap?(app: ClientApp): void | Promise<void>;
}

/**
 * A Plugin is a self-contained feature, defined as PLAIN DATA.
 * It declares its SERVER half (routes, controllers, services, policies) and,
 * optionally, its ADMIN half (`admin`) — the server/admin split.
 * Mirrors Strapi's `defaultPlugin` shape (loaders/plugins/index.ts:18).
 */
export interface Plugin {
  name: string;
  routes?: Route[];
  controllers?: Record<string, ControllerFactory>;
  services?: Record<string, ServiceFactory>;
  policies?: Record<string, Policy>;
  register?(app: App): void | Promise<void>;
  bootstrap?(app: App): void | Promise<void>;
  /** The admin/client half of the plugin (menu, pages, components). */
  admin?: AdminPlugin;
}
