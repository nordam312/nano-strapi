/**
 * The DI (Dependency Injection) Container.
 *
 * This is the heart of the framework — one central object that holds every
 * service (plugins, router, controllers, config...). Instead of files importing
 * each other directly (tight coupling), everything is registered here by NAME
 * and looked up at runtime. This is exactly what Strapi's `strapi.add()` /
 * `strapi.get()` do.
 *
 * Key idea: LAZY instantiation.
 *   - `register(name, factory)` just STORES a factory function. Nothing runs.
 *   - `get(name)` runs the factory the FIRST time, caches the result, and
 *     returns the same instance forever after (a singleton).
 *
 * Why lazy? Because services depend on each other. If creating the "router"
 * needs "config", but "config" is registered later, eager creation would crash.
 * Lazy creation means a service is only built the moment someone actually needs it.
 */

// A factory is a function that builds a service. It receives the container
// so a service can look up its own dependencies.
type Factory<T = unknown> = (container: Container) => T;

export class Container {
  // Stored factories, keyed by service name.
  private factories = new Map<string, Factory>();
  // Cache of already-created instances (so each service is a singleton).
  private instances = new Map<string, unknown>();

  /**
   * Register a service by name. Returns `this` so calls can be chained,
   * just like Strapi: container.register('a', ...).register('b', ...).
   */
  register<T>(name: string, factory: Factory<T>): this {
    if (this.factories.has(name)) {
      throw new Error(`Service "${name}" is already registered.`);
    }
    this.factories.set(name, factory as Factory);
    return this;
  }

  /**
   * Get a service by name. Builds it on first access, then caches it.
   */
  get<T = unknown>(name: string): T {
    // Already built? Return the cached instance.
    if (this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service "${name}" is not registered.`);
    }

    // Build it now (lazy), cache it, return it.
    const instance = factory(this);
    this.instances.set(name, instance);
    return instance as T;
  }

  /** Check whether a service name is registered. */
  has(name: string): boolean {
    return this.factories.has(name);
  }
}
