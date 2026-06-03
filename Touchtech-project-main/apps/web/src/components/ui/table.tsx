import { cn } from '@/lib/cn';

/** Lightweight table primitives with sticky header and hover rows. */
export function Table({ className, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...rest} />
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 bg-surface text-left text-xs uppercase tracking-wide text-muted">
      {children}
    </thead>
  );
}

export function Th({ className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-2.5 font-medium', className)} {...rest} />;
}

export function Tr({ className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-t border-border hover:bg-elevated/60', className)} {...rest} />;
}

export function Td({ className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-fg', className)} {...rest} />;
}
