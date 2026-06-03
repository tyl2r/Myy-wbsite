'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from '@/components/command/command-palette';
import { useCommandSearch } from '@/hooks/use-command-search';

/**
 * Role-agnostic application shell. Each role layout renders this with its own
 * page title; nav contents adapt to the session role automatically. Dynamic
 * search entries are injected into the command palette.
 */
export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const searchEntries = useCommandSearch();
  return (
    <div className="flex min-h-screen">
      <a href="#main-content" className="skip-link rounded-lg bg-brand px-3 py-2 text-sm text-white">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
      <CommandPalette extra={searchEntries} />
    </div>
  );
}
