/**
 * compose-endpoint — turns one route (DATA) into a callable handler (BEHAVIOR).
 *
 * This is the nano version of Strapi's compose-endpoint.ts. For now it only
 * resolves the handler string to the controller action. In Stage 5 we'll wrap
 * the action with middleware (auth, policies) using the onion pattern — the
 * `compose([...])` call you saw at compose-endpoint.ts:85.
 */

import type { App } from './app.js';
import type { Action, Route } from './types.js';
import { getController } from './plugins.js';

/**
 * Split "article.find" into { controllerName: "article", actionName: "find" }.
 * (Strapi splits on the LAST dot — mirrored here.)
 */
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

/**
 * Resolve a route's handler string to the real controller action function.
 * "article.find" + pluginName "articles"
 *   → container key "controller.articles.article"
 *   → that controller's `find` method.
 */
export function getAction(app: App, route: Route): Action {
  const pluginName = route.info?.pluginName;
  if (!pluginName) {
    throw new Error(`Route ${route.method} ${route.path} is missing info.pluginName.`);
  }

  const { controllerName, actionName } = extractHandlerParts(route.handler);

  // Reuse the Stage 3 string→object resolution.
  const controller = getController(app, `${pluginName}.${controllerName}`);
  const action = controller[actionName];

  if (typeof action !== 'function') {
    throw new Error(`Handler not found: "${route.handler}" in plugin "${pluginName}".`);
  }

  return action;
}

/**
 * Compose a route into its final handler.
 * Stage 4: just the action. Stage 5: compose([...middlewares, action]).
 */
export function composeEndpoint(app: App, route: Route): Action {
  return getAction(app, route);
}
