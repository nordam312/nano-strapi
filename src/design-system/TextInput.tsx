/**
 * TextInput — a styled text input that selects its content on keyboard focus.
 *
 * This is the nano-strapi echo of the fix contributed to Strapi: the input
 * composes the caller's onFocus with a select-on-keyboard-focus handler, so
 * tabbing in selects the text while clicking still places the caret.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';

import { useSelectOnFocus } from './useSelectOnFocus.js';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ onFocus, style, ...props }, ref) => {
    const { onFocus: handleFocus } = useSelectOnFocus(onFocus);

    return (
      <input
        ref={ref}
        onFocus={handleFocus}
        {...props}
        style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, ...style }}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
