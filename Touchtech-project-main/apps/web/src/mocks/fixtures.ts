import type { DeliveryRequest } from '@/types/domain';

/** Deterministic demo fixtures for local development via MSW. */
export const demoUser = {
  id: '1',
  email: 'user@routeshare.dev',
  fullName: 'Demo User',
  role: 'user' as const,
};

export const requests: DeliveryRequest[] = Array.from({ length: 24 }).map((_, i) => ({
  id: String(1000 + i),
  status: (['created', 'in_transit', 'delivered', 'confirmed'] as const)[i % 4],
  pickupText: `Pickup location ${i + 1}`,
  dropoffText: `Dropoff location ${i + 1}`,
  recipientName: `Recipient ${i + 1}`,
  packageSize: (['xs', 's', 'm', 'l'] as const)[i % 4],
  priceCents: 500 + i * 35,
  distanceM: 1200 + i * 240,
  createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
}));
