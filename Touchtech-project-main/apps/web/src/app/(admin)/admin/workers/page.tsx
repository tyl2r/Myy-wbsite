'use client';

import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/auth/can';
import { useAdminUsers, useVerifyWorker } from '@/hooks/use-admin';
import type { AdminUserRow } from '@/types/domain';

export default function AdminWorkers() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminUsers('worker');
  const verify = useVerifyWorker();
  const rows = data?.pages.flatMap((p) => p.rows) ?? [];

  const columns: Column<AdminUserRow>[] = [
    { key: 'name', header: 'Worker', render: (w) => <span className="font-medium text-fg">{w.fullName}</span> },
    { key: 'email', header: 'Email', render: (w) => <span className="text-muted">{w.email}</span> },
    {
      key: 'status',
      header: 'Account',
      render: (w) => <Badge tone={w.status === 'active' ? 'success' : 'danger'} dot>{w.status}</Badge>,
    },
    { key: 'rating', header: 'Rating', align: 'right', render: (w) => w.ratingAvg },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (w) => (
        <Can capability="admin.verifyWorkers">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => verify.mutate({ id: w.id, decision: 'verified' })}>
              Verify
            </Button>
            <Button size="sm" variant="secondary" onClick={() => verify.mutate({ id: w.id, decision: 'rejected' })}>
              Reject
            </Button>
          </div>
        </Can>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Workers" description="Verify and manage delivery workers." />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(w) => w.id}
        loading={isLoading}
        emptyTitle="No workers"
        onLoadMore={() => fetchNextPage()}
        hasMore={!!hasNextPage}
        loadingMore={isFetchingNextPage}
      />
    </>
  );
}
