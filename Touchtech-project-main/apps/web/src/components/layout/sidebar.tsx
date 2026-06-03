'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { useAuth } from '@/stores/auth.store';
import { useUi } from '@/stores/ui.store';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

/**
 * Responsive sidebar. Desktop: persistent rail. Mobile: off-canvas drawer
 * toggled from the topbar, closing on navigation or overlay tap.
 */
export function Sidebar() {
  const role = useAuth((s) => s.user?.role);
  const pathname = usePathname();
  const { sidebarOpen, setSidebar } = useUi();
  const items = role ? NAV[role] : [];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebar(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-surface',
          'transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Primary"
      >
        <div className="flex h-14 items-center gap-2 px-5">
          <span className="h-6 w-6 rounded-md bg-brand" aria-hidden />
          <span className="font-semibold tracking-tight">RouteShare</span>
        </div>
        <nav className="px-3 py-2">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebar(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-subtle text-brand'
                        : 'text-muted hover:bg-elevated hover:text-fg',
                    )}
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
