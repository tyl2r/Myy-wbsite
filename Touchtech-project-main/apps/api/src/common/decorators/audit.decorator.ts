import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMeta {
  action: string;
  entityType: string;
}

/**
 * Flags a route for audit logging. The AuditInterceptor records the actor,
 * action, and affected entity after the handler succeeds.
 */
export const Audit = (action: string, entityType: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType } satisfies AuditMeta);
