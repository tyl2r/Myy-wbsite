'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';

/** Password field with a show/hide toggle that stays keyboard-accessible. */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>((props, ref) => {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={shown ? 'text' : 'password'} className="pr-16" {...props} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted hover:text-fg"
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';
