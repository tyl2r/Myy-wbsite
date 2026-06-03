'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthError } from '@/components/auth/auth-error';
import { PasswordInput } from '@/components/auth/password-input';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/hooks/use-auth-actions';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { submit, error, pending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your RouteShare account"
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <form onSubmit={handleSubmit((v) => submit(v.email, v.password))} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" {...register('password')} invalid={!!errors.password} />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-muted hover:text-fg">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={pending} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
