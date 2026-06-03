import { AppShell } from '@/components/layout/app-shell';
import { RoleGuard } from '@/components/auth/role-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={['admin']}>
      <AppShell title="Admin">{children}</AppShell>
    </RoleGuard>
  );
}
