'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/stores/auth.store';
import { ApiError } from '@/lib/api/envelope';
import type { Role } from '@/types/domain';

const LANDING: Record<Role, string> = {
  user: '/u/dashboard',
  worker: '/w/dashboard',
  admin: '/admin/overview',
};

/**
 * Thin action hooks wrapping the auth store with form-friendly error + pending
 * state and post-success navigation. Kept out of the store so the store stays
 * routing-agnostic and unit-testable.
 */
export function useLogin() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(email: string, password: string) {
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      const role = useAuth.getState().user?.role ?? 'user';
      router.replace(LANDING[role]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to sign in');
    } finally {
      setPending(false);
    }
  }

  return { submit, error, pending };
}

export function useRegister() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(input: {
    email: string;
    password: string;
    fullName: string;
    role: 'user' | 'worker';
  }) {
    setError(null);
    setPending(true);
    try {
      await api.post('/auth/register', input);
      // Registration returns a token pair; reuse login to hydrate the session.
      await useAuth.getState().login(input.email, input.password);
      router.replace(LANDING[input.role]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unable to create account');
    } finally {
      setPending(false);
    }
  }

  return { submit, error, pending };
}
