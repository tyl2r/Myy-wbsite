import type { Role } from '@/types/domain';

export interface NavItem {
  label: string;
  href: string;
  /** Lucide-style icon key resolved by the Icon component. */
  icon: string;
}

/**
 * Role-scoped navigation. Drives the sidebar, the command palette's static
 * destinations, and the search index, so the three never drift apart.
 */
export const NAV: Record<Role, NavItem[]> = {
  user: [
    { label: 'Dashboard', href: '/u/dashboard', icon: 'home' },
    { label: 'New request', href: '/u/requests/new', icon: 'plus' },
    { label: 'My requests', href: '/u/requests', icon: 'package' },
  ],
  worker: [
    { label: 'Dashboard', href: '/w/dashboard', icon: 'home' },
    { label: 'Request feed', href: '/w/feed', icon: 'inbox' },
    { label: 'My deliveries', href: '/w/deliveries', icon: 'route' },
  ],
  admin: [
    { label: 'Overview', href: '/admin/overview', icon: 'gauge' },
    { label: 'Live operations', href: '/admin/live', icon: 'radio' },
    { label: 'Requests', href: '/admin/requests', icon: 'package' },
    { label: 'Users', href: '/admin/users', icon: 'users' },
    { label: 'Workers', href: '/admin/workers', icon: 'truck' },
  ],
};
