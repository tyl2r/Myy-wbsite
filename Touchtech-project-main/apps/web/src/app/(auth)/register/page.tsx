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
import { useRegister } from '@/hooks/use-auth-actions';
import { cn } from '@/lib/cn';

const VEHICLES = [
  { value: 'bike', label: '🚲 Bike' },
  { value: 'motorbike', label: '🛵 Motorbike' },
  { value: 'car', label: '🚗 Car' },
  { value: 'van', label: '🚐 Van' },
  { value: 'foot', label: '🚶 On foot' },
] as const;

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(10, 'Use at least 10 characters'),
    role: z.enum(['user', 'worker']),
    vehicle: z.enum(['bike', 'motorbike', 'car', 'van', 'foot']).optional(),
  })
  .refine(
    (v) => v.role !== 'worker' || !!v.vehicle,
    { message: 'Select your vehicle type', path: ['vehicle'] },
  );
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const { submit, error, pending } = useRegister();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: 'user' } });
  const role = watch('role');
  const vehicle = watch('vehicle');

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start sending or delivering with RouteShare"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AuthError message={error} />
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" autoComplete="name" {...register('fullName')} invalid={!!errors.fullName} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} invalid={!!errors.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 10 characters">
          <PasswordInput id="password" autoComplete="new-password" {...register('password')} invalid={!!errors.password} />
        </Field>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-fg">I want to</legend>
          <div className="grid grid-cols-2 gap-2">
            {([['user', 'Send deliveries'], ['worker', 'Deliver & earn']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value)}
                aria-pressed={role === value}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm transition-colors',
                  role === value
                    ? 'border-brand bg-brand-subtle text-brand'
                    : 'border-border text-muted hover:text-fg',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {role === 'worker' && (
          <Field label="Vehicle type" htmlFor="vehicle" error={errors.vehicle?.message} required>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('vehicle', value)}
                  aria-pressed={vehicle === value}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs transition-colors',
                    vehicle === value
                      ? 'border-brand bg-brand-subtle text-brand'
                      : 'border-border text-muted hover:text-fg',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Button type="submit" loading={pending} className="w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
