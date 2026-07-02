/**
 * Table — a generic, presentational table. Columns describe how to render each
 * cell; rows are the data. Reusable by any plugin. (Mirrors a design-system Table.)
 */

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** Optional custom cell renderer; defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
}

const cell = { padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'left' } as const;
const head = { ...cell, background: '#f6f6f9', fontWeight: 600 } as const;

export function Table<T>({ columns, rows }: TableProps<T>) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={head}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col) => (
              <td key={col.key} style={cell}>
                {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key])}
                  
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
