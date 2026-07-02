/**
 * The nano-strapi design-system: a small library of presentational components
 * shared across the admin, so plugins don't each reinvent buttons/tables/inputs.
 * Mirrors @strapi/design-system (the package the upstream select-on-focus fix
 * ultimately serves).
 */

export { Button } from './Button.js';
export { TextInput } from './TextInput.js';
export { Table, type Column } from './Table.js';
export { useSelectOnFocus } from './useSelectOnFocus.js';
