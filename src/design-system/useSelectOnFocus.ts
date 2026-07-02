/**
 * useSelectOnFocus — selects a text field's content when it's focused via the
 * keyboard (e.g. Tab), but not on mouse click. Composes any caller-provided
 * onFocus so it still runs.
 *
 * This is the same pattern contributed upstream to Strapi's admin inputs: infer
 * the focus modality from the last interaction (keydown Tab vs pointerdown),
 * since the focus event alone doesn't tell you how focus was acquired.
 */

import { useCallback, useEffect, type FocusEvent, type FocusEventHandler } from 'react';

let lastInteractionWasKeyboard = true;
let listenersInitialized = false;

const initInteractionListeners = () => {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') lastInteractionWasKeyboard = true;
    },
    true
  );
  window.addEventListener('pointerdown', () => (lastInteractionWasKeyboard = false), true);
};

export function useSelectOnFocus(onFocus?: FocusEventHandler<HTMLInputElement>) {
  useEffect(() => {
    initInteractionListeners();
  }, []);

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (lastInteractionWasKeyboard) {
        event.currentTarget.select();
      }
      onFocus?.(event); // caller's handler always runs
    },
    [onFocus]
  );

  return { onFocus: handleFocus };
}
