'use client';

import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/status';

interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (tone: Tone, message: string) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (tone, message) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const toneBorder: Record<Tone, string> = {
  info: 'border-l-info',
  brand: 'border-l-brand',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  muted: 'border-l-muted',
};

/** Top-right toast stack. Rendered once at the app root. */
export function ToastRegion() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            role="status"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            onClick={() => dismiss(t.id)}
            className={cn(
              'cursor-pointer rounded-lg border border-l-4 border-border bg-surface px-4 py-3 text-sm text-fg shadow-md',
              toneBorder[t.tone],
            )}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
