/**
 * Frontend mirror of the backend domain types. Kept hand-synced with the API
 * DTOs; a future improvement is to generate these from the OpenAPI schema.
 */
export type Role = 'admin' | 'user' | 'worker';

export type RequestStatus =
  | 'created'
  | 'matched'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'cancelled'
  | 'failed';

export type PackageSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface DeliveryRequest {
  id: string;
  status: RequestStatus;
  pickupText: string;
  dropoffText: string;
  recipientName: string;
  packageSize: PackageSize;
  priceCents: number;
  distanceM: number | null;
  createdAt: string;
}

export type WorkerVerification = 'pending' | 'verified' | 'rejected';

export interface WorkerProfile {
  userId: string;
  verification: WorkerVerification;
  vehicle: 'bike' | 'motorbike' | 'car' | 'van' | 'foot';
  isAvailable: boolean;
  maxDetourPct: number;
}

export interface NearbyRequest {
  id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_m: number;
}

export interface BatchStop {
  requestId: string;
  type: 'pickup' | 'dropoff';
  seq: number;
}

export interface Batch {
  id: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  stopOrder: BatchStop[];
  createdAt: string;
}

export interface AdminMetrics {
  requestsByStatus: Record<string, number>;
  activeWorkers: number;
  fulfillmentRate: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: 'active' | 'suspended' | 'deleted';
  ratingAvg: string;
  createdAt: string;
}

export interface LivePosition {
  batch_id: string;
  worker_id: string;
  lat: number;
  lng: number;
  at: string;
}
