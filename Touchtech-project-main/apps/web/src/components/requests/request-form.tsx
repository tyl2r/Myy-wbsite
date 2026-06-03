'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreateRequest } from '@/hooks/use-requests';
import { money, distance } from '@/lib/format';
import { haversine } from '@/lib/geo';

// Mirrors the backend create-request DTO (kept in sync; see DTO-gen plan).
const schema = z
  .object({
    pickupText: z.string().min(3, 'Enter a pickup location'),
    pickupLat: z.coerce.number().min(-90).max(90),
    pickupLng: z.coerce.number().min(-180).max(180),
    dropoffText: z.string().min(3, 'Enter a dropoff location'),
    dropoffLat: z.coerce.number().min(-90).max(90),
    dropoffLng: z.coerce.number().min(-180).max(180),
    recipientName: z.string().min(2, 'Recipient name is required'),
    recipientPhone: z.string().optional(),
    packageSize: z.enum(['xs', 's', 'm', 'l', 'xl']),
    notes: z.string().max(500).optional(),
    windowStart: z.string().optional(),
    windowEnd: z.string().optional(),
  })
  .refine(
    (v) =>
      !v.windowStart ||
      !v.windowEnd ||
      new Date(v.windowEnd) > new Date(v.windowStart),
    { message: 'Window end must be after window start', path: ['windowEnd'] },
  );
type FormValues = z.infer<typeof schema>;

const SIZE_MULT: Record<FormValues['packageSize'], number> = {
  xs: 1, s: 1.1, m: 1.25, l: 1.5, xl: 2,
};

export function RequestForm() {
  const router = useRouter();
  const create = useCreateRequest();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { packageSize: 's' },
  });

  const values = watch();
  const meters =
    values.pickupLat && values.dropoffLat
      ? haversine(
          { lat: values.pickupLat, lng: values.pickupLng },
          { lat: values.dropoffLat, lng: values.dropoffLng },
        )
      : 0;
  const quoteCents = Math.round((300 + 120 * (meters / 1000)) * SIZE_MULT[values.packageSize ?? 's']);

  const onSubmit = handleSubmit(async (v) => {
    await create.mutateAsync({
      pickup: { lat: v.pickupLat, lng: v.pickupLng },
      pickupText: v.pickupText,
      dropoff: { lat: v.dropoffLat, lng: v.dropoffLng },
      dropoffText: v.dropoffText,
      recipientName: v.recipientName,
      recipientPhone: v.recipientPhone,
      packageSize: v.packageSize,
      notes: v.notes,
    });
    router.push('/u/requests');
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Pickup location" htmlFor="pickupText" error={errors.pickupText?.message} required>
          <Input id="pickupText" {...register('pickupText')} invalid={!!errors.pickupText} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pickup lat" htmlFor="pickupLat" error={errors.pickupLat?.message}>
            <Input id="pickupLat" inputMode="decimal" {...register('pickupLat')} />
          </Field>
          <Field label="Pickup lng" htmlFor="pickupLng" error={errors.pickupLng?.message}>
            <Input id="pickupLng" inputMode="decimal" {...register('pickupLng')} />
          </Field>
        </div>

        <Field label="Dropoff location" htmlFor="dropoffText" error={errors.dropoffText?.message} required>
          <Input id="dropoffText" {...register('dropoffText')} invalid={!!errors.dropoffText} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dropoff lat" htmlFor="dropoffLat" error={errors.dropoffLat?.message}>
            <Input id="dropoffLat" inputMode="decimal" {...register('dropoffLat')} />
          </Field>
          <Field label="Dropoff lng" htmlFor="dropoffLng" error={errors.dropoffLng?.message}>
            <Input id="dropoffLng" inputMode="decimal" {...register('dropoffLng')} />
          </Field>
        </div>

        <Field label="Recipient name" htmlFor="recipientName" error={errors.recipientName?.message} required>
          <Input id="recipientName" {...register('recipientName')} invalid={!!errors.recipientName} />
        </Field>
        <Field label="Recipient phone" htmlFor="recipientPhone">
          <Input id="recipientPhone" {...register('recipientPhone')} />
        </Field>

        <Field label="Package size" htmlFor="packageSize">
          <select
            id="packageSize"
            {...register('packageSize')}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg"
          >
            {(['xs', 's', 'm', 'l', 'xl'] as const).map((s) => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create request
          </Button>
        </div>
      </form>

      <Card className="h-fit p-5">
        <h3 className="text-sm font-semibold text-fg">Estimate</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Distance</dt>
            <dd className="tabular text-fg">{distance(meters || null)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Estimated price</dt>
            <dd className="tabular font-medium text-fg">{meters ? money(quoteCents) : '—'}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          Final price is confirmed when a worker accepts your request.
        </p>
      </Card>
    </div>
  );
}
