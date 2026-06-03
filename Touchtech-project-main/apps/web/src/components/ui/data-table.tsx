'use client';

import { Table, Thead, Th, Tr, Td } from './table';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';
import { Button } from './button';

export interface Column<T> {
  key: string;
  header: string;
  /** Right-align numeric/mono columns. */
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

/**
 * Reusable, accessible data table used by every admin management screen.
 * Handles loading (skeleton rows), empty state, and cursor "load more" so the
 * management pages stay free of table boilerplate and behave consistently.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = 'Nothing to show',
  emptyDescription,
  onLoadMore,
  hasMore,
  loadingMore,
}: DataTableProps<T>) {
  if (!loading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <Table>
        <Thead>
          <tr>
            {columns.map((c) => (
              <Th key={c.key} className={c.align === 'right' ? 'text-right' : undefined}>
                {c.header}
              </Th>
            ))}
          </tr>
        </Thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Tr key={i}>
                  {columns.map((c) => (
                    <Td key={c.key}>
                      <Skeleton className="h-4 w-24" />
                    </Td>
                  ))}
                </Tr>
              ))
            : rows.map((row) => (
                <Tr key={rowKey(row)}>
                  {columns.map((c) => (
                    <Td key={c.key} className={c.align === 'right' ? 'text-right tabular' : undefined}>
                      {c.render(row)}
                    </Td>
                  ))}
                </Tr>
              ))}
        </tbody>
      </Table>
      {hasMore && (
        <div className="flex justify-center border-t border-border p-3">
          <Button variant="secondary" size="sm" loading={loadingMore} onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
