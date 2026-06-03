'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';
import { PasswordInput } from '@/components/auth/password-input';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/envelope';

const schema = z
  .object({
    password: z.string().min(10, 'Use at least 10 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Could not reset password. The link may have expired.',
      );
    } finally {
      setPending(false);
    }
  });

  return (
    <AuthCard
      title="Choose a new password"
      subtitle={done ? 'Password updated!' : 'Enter your new password below'}
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <p className="text-sm text-muted">
          Your password has been updated. You can now{' '}
          <Link href="/login" className="font-medium text-brand hover:underline">
            sign in
          </Link>{' '}
          with your new password.
        </p>
      ) : (
        <>
          <AuthError message={error} />
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="New password" htmlFor="password" error={errors.password?.message} hint="At least 10 characters">
              <PasswordInput
                id="password"
                autoComplete="new-password"
                {...register('password')}
                invalid={!!errors.password}
              />
            </Field>
            <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                {...register('confirm')}
                invalid={!!errors.confirm}
              />
            </Field>
            <Button type="submit" loading={pending} className="w-full">
              Update password
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
