'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminUsers, useSetUserStatus } from '@/hooks/use-admin';
import type { AdminUserRow, Role } from '@/types/domain';
import { cn } from '@/lib/cn';

const ROLE_FILTERS: { label: string; value?: Role }[] = [
  { label: 'All' },
  { label: 'Users', value: 'user' },
  { label: 'Workers', value: 'worker' },
  { label: 'Admins', value: 'admin' },
];

export default function AdminUsers() {
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminUsers(role);
  const setStatus = useSetUserStatus(role);

  const rows = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.rows) ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [data, search]);

  const columns: Column<AdminUserRow>[] = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-fg">{u.fullName}</span> },
    { key: 'email', header: 'Email', render: (u) => <span className="text-muted">{u.email}</span> },
    { key: 'role', header: 'Role', render: (u) => <Badge tone="info">{u.role}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge tone={u.status === 'active' ? 'success' : 'danger'} dot>{u.status}</Badge>,
    },
    { key: 'rating', header: 'Rating', align: 'right', render: (u) => u.ratingAvg },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setStatus.mutate({ id: u.id, status: u.status === 'active' ? 'suspended' : 'active' })}
        >
          {u.status === 'active' ? 'Suspend' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Users" description="Manage accounts across all roles." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Filter by role">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.label}
              role="tab"
              aria-selected={role === f.value}
              onClick={() => setRole(f.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                role === f.value ? 'border-brand bg-brand-subtle text-brand' : 'border-border text-muted hover:text-fg',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:ml-auto sm:max-w-xs"
          aria-label="Search users"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={isLoading}
        emptyTitle="No users found"
        onLoadMore={() => fetchNextPage()}
        hasMore={!!hasNextPage}
        loadingMore={isFetchingNextPage}
      />
    </>
  );
}
