'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/envelope';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    setPending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Try again.');
    } finally {
      setPending(false);
    }
  });

  return (
    <AuthCard
      title="Reset your password"
      subtitle={sent ? 'Check your inbox' : 'Enter your email to receive a reset link'}
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-muted">
          If an account exists for that email, we sent a password reset link.
          Check your inbox (and spam folder).
        </p>
      ) : (
        <>
          <AuthError message={error} />
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                invalid={!!errors.email}
              />
            </Field>
            <Button type="submit" loading={pending} className="w-full">
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  );
}
