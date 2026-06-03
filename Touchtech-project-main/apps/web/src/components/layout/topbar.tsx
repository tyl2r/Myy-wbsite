'use client';

import { useUi } from '@/stores/ui.store';
import { useTheme } from '@/components/theme/theme-provider';
import { Icon } from '@/components/ui/icon';

/** Topbar: mobile menu, page title, palette-trigger search, theme, bell, avatar. */
export function Topbar({ title }: { title: string }) {
  const { toggleSidebar, setPalette } = useUi();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur">
      <button
        className="rounded-lg p-2 text-muted hover:bg-elevated lg:hidden"
        onClick={toggleSidebar}
        aria-label="Open navigation"
      >
        <Icon name="menu" />
      </button>

      <h1 className="text-sm font-semibold text-fg">{title}</h1>

      <button
        onClick={() => setPalette(true)}
        className="ml-auto hidden items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm text-muted hover:text-fg sm:flex"
        aria-label="Search"
      >
        <Icon name="search" className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="ml-2 rounded border border-border px-1.5 font-mono text-xs">⌘K</kbd>
      </button>

      <button
        onClick={toggle}
        className="rounded-lg p-2 text-muted hover:bg-elevated"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>

      <button className="rounded-lg p-2 text-muted hover:bg-elevated" aria-label="Notifications">
        <Icon name="bell" />
      </button>

      <button
        className="h-8 w-8 rounded-full bg-elevated text-sm font-medium text-fg"
        aria-label="Account menu"
      >
        <span aria-hidden>·</span>
      </button>
    </header>
  );
}
