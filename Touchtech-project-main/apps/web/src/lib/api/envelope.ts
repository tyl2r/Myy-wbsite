/** Backend response envelopes: { data, meta } on success, { error } on failure. */
export interface Envelope<T> {
  data: T;
  meta?: { nextCursor?: string | null } | null;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
