import { z } from 'zod';

const latLng = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createRequestSchema = z
  .object({
    pickup: latLng,
    pickupText: z.string().min(3).max(255),
    dropoff: latLng,
    dropoffText: z.string().min(3).max(255),
    recipientName: z.string().min(2).max(120),
    recipientPhone: z.string().min(7).max(20).optional(),
    packageSize: z.enum(['xs', 's', 'm', 'l', 'xl']),
    notes: z.string().max(500).optional(),
    windowStart: z.coerce.date().optional(),
    windowEnd: z.coerce.date().optional(),
  })
  .refine(
    (v) => !v.windowStart || !v.windowEnd || v.windowEnd > v.windowStart,
    { message: 'windowEnd must be after windowStart', path: ['windowEnd'] },
  );
export type CreateRequestDto = z.infer<typeof createRequestSchema>;

export const listRequestsSchema = z.object({
  status: z
    .enum([
      'created',
      'matched',
      'accepted',
      'picked_up',
      'in_transit',
      'delivered',
      'confirmed',
      'cancelled',
      'failed',
    ])
    .optional(),
  cursor: z.coerce.bigint().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListRequestsDto = z.infer<typeof listRequestsSchema>;
