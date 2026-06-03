import { AppShell } from '@/components/layout/app-shell';
import { RoleGuard } from '@/components/auth/role-guard';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={['worker']}>
      <AppShell title="RouteShare">{children}</AppShell>
    </RoleGuard>
  );
}
