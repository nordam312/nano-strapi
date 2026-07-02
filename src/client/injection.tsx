/**
 * Injection zones — the extension pattern that lets a plugin add UI into
 * ANOTHER plugin's page, without either one importing the other.
 *
 * How it works:
 *   - A page renders <InjectionZone name="some.zone" /> to say "others may add
 *     components here."
 *   - Any plugin calls app.injectComponent("some.zone", MyComponent) (usually in
 *     its register hook).
 *   - InjectionZone looks up whatever was registered for that name and renders it.
 *
 * This mirrors Strapi's InjectionZone + useStrapiApp (the admin exposes the app
 * via React context so deeply-nested components can read its registries).
 */

import { createContext, useContext } from 'react';

import type { ClientApp } from './client-app.js';

/** React context that carries the ClientApp down to every component. */
export const AppContext = createContext<ClientApp | null>(null);

/** Hook to read the running app from anywhere in the tree (like useStrapiApp). */
export function useApp(): ClientApp {
  const app = useContext(AppContext);
  if (!app) {
    throw new Error('useApp must be used inside the app (AppContext.Provider is missing).');
  }
  return app;
}

/**
 * Renders every component that plugins have injected into the named zone.
 * A page drops this wherever it wants to be extensible.
 */
export function InjectionZone({ name }: { name: string }) {
  const app = useApp();
  const components = app.getInjectedComponents(name);

  return (
    <>
      {components.map((Component, index) => (
        <Component key={index} />
      ))}
    </>
  );
}
