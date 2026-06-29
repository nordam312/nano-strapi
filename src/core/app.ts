/**
 * The App class — our equivalent of Strapi's `Strapi` class.
 *
 * It is essentially the DI container (Stage 1) wrapped with a LIFECYCLE.
 * Strapi's own class is the same idea: a container with `add`/`get` plus
 * `register()`, `bootstrap()`, `load()`, `start()` methods.
 *
 * Lifecycle (mirrors Strapi exactly):
 *
 *   start()                          [Strapi.ts:253]
 *     └─ load()                      [Strapi.ts:412]
 *          ├─ register()  ← all providers introduce themselves
 *          └─ bootstrap() ← all providers wire things up
 *     └─ "listen"  ← (HTTP server comes in a later stage)
 *
 * Nothing in the app "runs" until start(); the phases just organize pieces.
 */

import { Container } from './container.js';
import { createServer } from './server.js';
import type { Provider } from './types.js';

export class App {
  /** The DI container from Stage 1 — holds every service. */
  private container = new Container();

  /** The ordered list of providers that hook into the lifecycle. */
  private providers: Provider[];

  /** Guard flag — services aren't safe to use until this is true. */
  public isLoaded = false;

  constructor(providers: Provider[] = []) {
    this.providers = providers;
  }

  // --- Container delegation -------------------------------------------------
  // The app exposes add/get so callers use `app.add(...)` like `strapi.add(...)`
  // instead of reaching into the container directly.

  add<T>(name: string, factory: (app: App) => T): this {
    // We pass `this` (the app) to factories so services can resolve siblings
    // via app.get(...) — same ergonomics as Strapi's createService(strapi).
    this.container.register(name, () => factory(this));
    return this;
  }

  get<T = unknown>(name: string): T {
    return this.container.get<T>(name);
  }

  has(name: string): boolean {
    return this.container.has(name);
  }

  // --- Lifecycle phases -----------------------------------------------------

  /** Phase 1: run every provider's register() hook, in order. */
  async register(): Promise<this> {
    for (const provider of this.providers) {
      await provider.register?.(this);
    }
    return this;
  }

  /** Phase 2: run every provider's bootstrap() hook, in order. */
  async bootstrap(): Promise<this> {
    for (const provider of this.providers) {
      await provider.bootstrap?.(this);
    }
    return this;
  }

  /** load() = register THEN bootstrap. After this, services are safe to use. */
  async load(): Promise<this> {
    await this.register();
    await this.bootstrap();
    this.isLoaded = true;
    return this;
  }

  /**
   * start() = load (if needed) then open the HTTP server (go live).
   * Mirrors Strapi.start() → listen() (Strapi.ts:253 / 367).
   */
  async start(port = 1337): Promise<this> {
    if (!this.isLoaded) {
      await this.load();
    }

    const server = createServer(this);
    this.add('server', () => server);

    await new Promise<void>((resolve) => server.listen(port, resolve));
    console.log(`🚀 nano-strapi listening on http://localhost:${port}`);
    return this;
  }
}
