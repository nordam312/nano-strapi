# nano-strapi

A minimal, **zero-dependency** TypeScript implementation of a plugin-based framework architecture — the same design that powers [Strapi](https://github.com/strapi/strapi). It distills the core machinery most frameworks spread across thousands of files into ~600 readable lines, so the architecture is legible at a glance.

It implements the core machinery most web frameworks hide from you:

- a **dependency-injection container** with lazy, cached services
- a **lifecycle** (`register → bootstrap → start`) driven by **providers**
- a **plugin system** that turns plain-data plugin definitions into running behavior
- a **declarative router** where a route's `handler` is a string resolved to a function at boot
- **onion middleware** (`compose()` / `next()`) for auth, policies, and controllers — written from scratch (no Koa/Express)

> **Who this is for:** developers who want to understand how plugin-based frameworks boot and serve requests, and contributors onboarding to a large codebase like Strapi's. Every module here maps to a real Strapi file (see [the mapping](#how-this-maps-to-strapi)), so reading this small codebase is a fast on-ramp to the real one.

---

## Quick start

```bash
npm install
npm run dev          # starts the server on http://localhost:1337
```

Then, in another terminal:

```bash
# Public route
curl localhost:1337/articles

# Protected route — blocked by a policy (no auth header) → 403
curl -i -X POST localhost:1337/articles -d '{"title":"hi"}'

# Same route, now authorized (toy auth: the x-user header) → 200
curl -X POST localhost:1337/articles -H "x-user: ada" -d '{"title":"hi"}'

# A second, fully independent plugin
curl localhost:1337/users
```

```bash
npm test             # run the test suite (vitest)
npm run typecheck    # strict TypeScript, no emit
```

The tests cover the container (lazy/cached resolution), the onion `compose()` (ordering, short-circuit, double-`next()` guard), the router (matching, `:params`), and a full end-to-end request through a loaded app (including the policy 403 short-circuit). Vitest is the only non-runtime dependency.

---

## The request lifecycle

What happens when `POST /articles` arrives:

```
HTTP request
   │
   ▼
http server  ──►  build ctx (method, path, query, JSON body, headers)
   │
   ▼
Router.match()  ──►  find route + extract :params           (404 if none)
   │
   ▼
compose([ logger, ...policies, controllerAction ])   ← the onion
   │
   ├─ logger            before: start timer
   │   ├─ isAuthenticated policy   → if false: set 403, STOP (no next())
   │   │   └─ controller.create(ctx) → service.create() → "DB"
   │   └─ (returns up the chain)
   └─ logger            after: log "POST /articles → 200 (1ms)"
   │
   ▼
write ctx.status + JSON ctx.body
```

If a policy doesn't call `next()`, the controller never runs — that single rule is how all auth/permission middleware works.

---

## Architecture

```
src/
├── index.ts                  # entry point: build app from plugins, start it
├── core/
│   ├── container.ts          # DI container: register(name, factory) / get(name), lazy + cached
│   ├── app.ts                # App class = container + lifecycle (register/bootstrap/start)
│   ├── types.ts              # Provider, Plugin, Route, Context, Policy, ...
│   ├── plugins.ts            # plugin loader: data → behavior; PluginRegistry; getController/getService
│   ├── router.ts             # path matching (:params → regex), method+path lookup
│   ├── compose-endpoint.ts   # handler string → function; builds [policies, action] chain
│   ├── register-routes.ts    # "initRouting": walk plugins, register routes (runs after plugins load)
│   ├── compose.ts            # onion middleware (koa-compose) from scratch
│   └── server.ts             # Node http server: req → ctx → compose → response
└── plugins/
    ├── articles.ts           # example plugin: routes + controller + service + a policy
    └── users.ts              # a second, independent plugin (proves the system composes N plugins)
```

### Core ideas

**1. Everything is data first, behavior second.**
A plugin is a plain object declaring what it *has* (routes, controllers, services, policies). It never wires itself. The framework collects all that data at boot and turns it into running behavior. This is why a route can say `handler: 'article.find'` — a string — and have it resolve to a real function.

**2. The DI container decouples everything.**
Services don't import each other. A controller asks the container for its service by name (`getService(app, 'articles.article')`). Swap an implementation without touching callers.

**3. Lifecycle phases exist for dependency ordering.**
`register` (everyone introduces themselves) must finish before `bootstrap` (wire things up), because routes can't resolve controllers until controllers are registered. Adding a feature is one line: drop a plugin into the array in `index.ts`.

---

## How this maps to Strapi

Every piece here mirrors a real Strapi file, so studying this is a shortcut to reading the real codebase:

| nano-strapi | Strapi |
| --- | --- |
| `core/container.ts` | `strapi.add()` / `strapi.get()` (the Strapi DI container) |
| `core/app.ts` | the `Strapi` class (`packages/core/core/src/Strapi.ts`) |
| `Provider` + provider loop | `packages/core/core/src/providers/` |
| `core/plugins.ts` (loader) | `loaders/plugins/index.ts` (`loadPlugins`) |
| `PluginRegistry` | `strapi.get('plugins')` registry |
| `core/compose-endpoint.ts` | `services/server/compose-endpoint.ts` (`getAction`) |
| `core/register-routes.ts` | `services/server/register-routes.ts` + `initRouting()` |
| `core/compose.ts` | `koa-compose` |
| `core/server.ts` | the Koa server (`services/server/`) |
| `config.policies` on a route | Strapi route `policies` (RBAC) |

---

## Why the architecture looks like this

- **Config separated from code:** routes and plugins are data, which makes them trivial to read, test, and reorder. The "data → behavior" conversion happens once, at boot.
- **Dependency injection:** lazy, name-based resolution lets independent features coexist and depend on each other without import spaghetti.
- **Onion middleware:** the `next()` pattern is just function composition; "stopping" a request (auth, permissions) is simply not calling `next()`.
- **Lifecycle phases:** they encode the dependency order between "register everything" and "wire everything up" — routes can't resolve controllers until controllers exist.

---

## Status & scope

Intentionally minimal. This is a reference implementation, **not** a Strapi replacement — it deliberately omits the database layer, validation, the RBAC engine, the admin UI, and content-type schemas to keep the architecture in focus. Each commit corresponds to one build stage, so the git history reads as a guided construction of the framework.

## License

MIT
