import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from './data-table';

interface Row {
  id: string;
  name: string;
}
const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name },
];

describe('DataTable', () => {
  it('shows an empty state when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyTitle="Nothing" />);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
  });

  it('renders rows', () => {
    render(
      <DataTable
        columns={columns}
        rows={[{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }]}
        rowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('invokes onLoadMore when the affordance is clicked', () => {
    const onLoadMore = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={[{ id: '1', name: 'Alice' }]}
        rowKey={(r) => r.id}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );
    fireEvent.click(screen.getByText('Load more'));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
