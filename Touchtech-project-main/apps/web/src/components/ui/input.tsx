'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...rest }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'h-9 w-full rounded-lg border bg-surface px-3 text-sm text-fg',
      'placeholder:text-muted transition-colors',
      'focus:border-brand focus:outline-none',
      invalid ? 'border-danger' : 'border-border',
      className,
    )}
    {...rest}
  />
));
Input.displayName = 'Input';
