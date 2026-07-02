/**
 * Admin (client-side) type definitions — the browser half of the framework.
 *
 * These live SEPARATELY from the server types (core/types.ts) on purpose: this
 * file imports React, and the server must never bundle React (nor the browser
 * bundle node:http). That separation is exactly why Strapi ships a plugin as
 * two entry points — `strapi-server` and `strapi-admin`.
 */

import type { ComponentType } from 'react';

import type { ClientApp } from './client-app.js';

/** A UI component — a real React component now (was an HTML-string fn before). */
export type Component = ComponentType<any>;

/** A link in the admin's sidebar menu. */
export interface MenuItem {
  to: string;
  label: string;
}

/** A page is just a React component rendered for a route. */
export type Page = ComponentType;

/** A declarative admin route: a path mapped to a page component. */
export interface AdminRoute {
  path: string;
  component: Page;
}

/**
 * A settings page — lives under the dedicated /settings area and shows a link
 * in the settings sub-menu. Mirrors Strapi's addSettingsLink.
 */
export interface SettingsPage {
  /** Path relative to /settings (e.g. "articles" → /settings/articles). */
  path: string;
  label: string;
  component: Page;
}

/**
 * The admin (client) half of a plugin — declared as DATA, like the server half.
 * This is what a plugin registers into the ClientApp (our StrapiApp).
 */
export interface AdminPlugin {
  name: string;
  menu?: MenuItem[];
  routes?: AdminRoute[];
  settings?: SettingsPage[];
  components?: Record<string, Component>;
  register?(app: ClientApp): void | Promise<void>;
  bootstrap?(app: ClientApp): void | Promise<void>;
}
