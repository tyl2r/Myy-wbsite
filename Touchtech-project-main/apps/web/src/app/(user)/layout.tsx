import { AppShell } from '@/components/layout/app-shell';
import { RoleGuard } from '@/components/auth/role-guard';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={['user', 'admin']}>
      <AppShell title="RouteShare">{children}</AppShell>
    </RoleGuard>
  );
}
