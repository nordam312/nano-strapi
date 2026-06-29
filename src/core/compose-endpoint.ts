/**
 * compose-endpoint — turns one route (DATA) into a middleware chain (BEHAVIOR).
 *
 * Stage 4 resolved the handler string to the action. Stage 5 now also resolves
 * the route's `config.policies` to functions and returns the full per-route
 * chain: [...policyMiddlewares, actionMiddleware]. The HTTP server prepends
 * global middleware (e.g. a logger) and runs the whole thing through compose().
 *
 * This mirrors Strapi's compose-endpoint.ts:85, where the route handler is
 * compose([... authenticate, authorize, policies, ...middlewares, action]).
 */

import type { App } from './app.js';
import type { Action, Policy, Route } from './types.js';
import type { Middleware } from './compose.js';
import { getController } from './plugins.js';

function extractHandlerParts(handler: string): { controllerName: string; actionName: string } {
  const lastDot = handler.lastIndexOf('.');
  if (lastDot === -1) {
    throw new Error(`Invalid handler "${handler}" — expected "controller.action".`);
  }
  return {
    controllerName: handler.slice(0, lastDot),
    actionName: handler.slice(lastDot + 1),
  };
}

/** Resolve a route's handler string to the real controller action function. */
export function getAction(app: App, route: Route): Action {
  const pluginName = route.info?.pluginName;
  if (!pluginName) {
    throw new Error(`Route ${route.method} ${route.path} is missing info.pluginName.`);
  }

  const { controllerName, actionName } = extractHandlerParts(route.handler);
  const controller = getController(app, `${pluginName}.${controllerName}`);
  const action = controller[actionName];

  if (typeof action !== 'function') {
    throw new Error(`Handler not found: "${route.handler}" in plugin "${pluginName}".`);
  }

  return action;
}

/** Wrap a policy as middleware: block (no next) if it returns false. */
function policyToMiddleware(policy: Policy, name: string): Middleware {
  return async (ctx, next) => {
    const allowed = await policy(ctx);
    if (!allowed) {
      // Short-circuit: do NOT call next(), so the action never runs.
      ctx.status = 403;
      ctx.body = { error: `Forbidden by policy "${name}"` };
      return;
    }
    await next();
  };
}

/** Wrap the controller action as the terminal middleware. */
function actionToMiddleware(action: Action): Middleware {
  return async (ctx) => {
    const result = await action(ctx);
    // If the controller returned a value, use it as the response body
    // (like Strapi's returnBodyMiddleware at compose-endpoint.ts:64).
    if (result !== undefined && (ctx.body === null || ctx.body === undefined)) {
      ctx.body = result;
    }
  };
}

/**
 * Build the per-route middleware chain: policies first, action last.
 */
export function composeEndpoint(app: App, route: Route): Middleware[] {
  const action = getAction(app, route);

  const policyMiddlewares = (route.config?.policies ?? []).map((name) => {
    const policy = app.get<Policy>(`policy.${name}`);
    return policyToMiddleware(policy, name);
  });

  return [...policyMiddlewares, actionToMiddleware(action)];
}
