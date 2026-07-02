/**
 * Button — a presentational component with variants. Purely visual, no app
 * logic, so any plugin can reuse it. (Mirrors @strapi/design-system's Button.)
 */

import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', style, ...props }: ButtonProps) {
  const base = {
    padding: '8px 14px',
    borderRadius: 6,
    border: '1px solid transparent',
    cursor: 'pointer',
    fontSize: 14,
  } as const;

  const variants = {
    primary: { background: '#4945ff', color: '#fff' },
    secondary: { background: '#fff', color: '#4945ff', borderColor: '#4945ff' },
  } as const;

  return <button type="button" {...props} style={{ ...base, ...variants[variant], ...style }} />;
}
