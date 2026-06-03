'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useUi } from '@/stores/ui.store';
import { useAuth } from '@/stores/auth.store';
import { NAV } from '@/lib/nav';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

export interface CommandEntry {
  id: string;
  label: string;
  group: string;
  href: string;
  icon?: string;
}

/**
 * First-class command palette (Cmd/Ctrl+K). Fully keyboard-driven: type to
 * filter, Arrow keys to move, Enter to go, Esc to close. Implemented as an ARIA
 * combobox + listbox. Static destinations come from the role nav; dynamic
 * entity results can be merged via the `extra` prop (wired by global search).
 */
export function CommandPalette({ extra = [] }: { extra?: CommandEntry[] }) {
  const { paletteOpen, setPalette } = useUi();
  const role = useAuth((s) => s.user?.role);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPalette]);

  const base: CommandEntry[] = useMemo(
    () =>
      (role ? NAV[role] : []).map((n) => ({
        id: n.href,
        label: n.label,
        group: 'Navigation',
        href: n.href,
        icon: n.icon,
      })),
    [role],
  );

  const results = useMemo(() => {
    const all = [...base, ...extra];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((e) => e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q));
  }, [base, extra, query]);

  useEffect(() => setActive(0), [query, paletteOpen]);
  useEffect(() => {
    if (paletteOpen) inputRef.current?.focus();
    else setQuery('');
  }, [paletteOpen]);

  const go = (entry?: CommandEntry) => {
    if (!entry) return;
    setPalette(false);
    router.push(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setPalette(false);
    }
  };

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setPalette(false)} aria-hidden />
          <motion.div
            initial={{ scale: 0.98, y: -6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: -6 }}
            transition={{ duration: 0.12 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Icon name="search" className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded
                aria-controls="command-list"
                aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search pages, requests, workers…"
                className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              />
              <kbd className="rounded border border-border px-1.5 font-mono text-xs text-muted">esc</kbd>
            </div>
            <ul id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">No results</li>
              )}
              {results.map((entry, i) => (
                <li
                  key={entry.id}
                  id={`cmd-${entry.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(entry)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                    i === active ? 'bg-elevated text-fg' : 'text-muted',
                  )}
                >
                  {entry.icon && <Icon name={entry.icon} className="h-4 w-4" />}
                  <span className="flex-1">{entry.label}</span>
                  <span className="text-xs text-muted">{entry.group}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
