import { z } from 'zod';

export const AuditActorTypeSchema = z.enum([
  'ADMIN_USER',
  'USER',
  'SYSTEM',
  'API_CLIENT',
  'PARTNER',
]);

export const AuditResultSchema = z.enum(['SUCCESS', 'DENIED', 'FAILED', 'PARTIAL']);

export const AuditActionSchema = z.enum([
  'CREATED',
  'UPDATED',
  'DELETED',
  'VIEWED',
  'APPROVED',
  'REJECTED',
  'EXPORTED',
  'IMPORTED',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGED',
  'STATUS_CHANGED',
  'PERMISSION_CHANGED',
  'ROLE_CHANGED',
  'IMPERSONATED',
  'CONFIG_CHANGED',
  'BOOKING_CREATED',
  'BOOKING_CANCELLED',
  'PAYMENT',
  'REFUND',
  'OTHER',
]);

const RESULT_ALIASES: Record<string, z.infer<typeof AuditResultSchema>> = {
  SUCCESS: 'SUCCESS',
  Success: 'SUCCESS',
  DENIED: 'DENIED',
  Denied: 'DENIED',
  FAILED: 'FAILED',
  Failed: 'FAILED',
  PARTIAL: 'PARTIAL',
  Partial: 'PARTIAL',
};

const ACTION_ALIASES: Record<string, z.infer<typeof AuditActionSchema>> = {
  CREATED: 'CREATED',
  Created: 'CREATED',
  UPDATED: 'UPDATED',
  Updated: 'UPDATED',
  DELETED: 'DELETED',
  Deleted: 'DELETED',
  VIEWED: 'VIEWED',
  Viewed: 'VIEWED',
  APPROVED: 'APPROVED',
  Approved: 'APPROVED',
  REJECTED: 'REJECTED',
  Rejected: 'REJECTED',
  EXPORTED: 'EXPORTED',
  Exported: 'EXPORTED',
  IMPORTED: 'IMPORTED',
  Imported: 'IMPORTED',
  LOGIN: 'LOGIN',
  Login: 'LOGIN',
  LOGOUT: 'LOGOUT',
  Logout: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  IMPERSONATED: 'IMPERSONATED',
  Impersonated: 'IMPERSONATED',
  CONFIG_CHANGED: 'CONFIG_CHANGED',
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  OTHER: 'OTHER',
};

function preprocessAuditPayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (typeof copy['action'] === 'string') {
    copy['action'] =
      ACTION_ALIASES[copy['action']] ??
      ACTION_ALIASES[copy['action'].toUpperCase()] ??
      copy['action'].toUpperCase();
  }
  if (typeof copy['result'] === 'string') {
    copy['result'] =
      RESULT_ALIASES[copy['result']] ??
      RESULT_ALIASES[copy['result'].toUpperCase()] ??
      copy['result'].toUpperCase();
  }
  if (typeof copy['actorEmail'] === 'string') {
    copy['actorEmail'] = copy['actorEmail'].trim().toLowerCase();
  }
  if (typeof copy['actorName'] === 'string') {
    copy['actorName'] = copy['actorName'].trim();
  }
  if (typeof copy['targetLabel'] === 'string') {
    copy['targetLabel'] = copy['targetLabel'].trim();
  }
  if (typeof copy['ip'] === 'string') {
    const ip = copy['ip'].trim();
    copy['ip'] = ip.length === 0 ? null : ip;
  }
  if (typeof copy['userAgent'] === 'string') {
    const ua = copy['userAgent'].trim();
    copy['userAgent'] = ua.length === 0 ? null : ua;
  }
  // UI aliases
  if (typeof copy['target'] === 'string' && !copy['targetLabel']) {
    copy['targetLabel'] = copy['target'];
  }
  if (typeof copy['when'] === 'string' && !copy['createdAt']) {
    copy['createdAt'] = copy['when'];
  }
  if (typeof copy['actor'] === 'string' && !copy['actorName']) {
    copy['actorName'] = copy['actor'];
  }
  return copy;
}

const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const CreateAuditLogBodySchema = z.object({
  corporateId: z.string().max(64).optional().nullable().default(null),
  actorId: z.string().max(64).optional().nullable().default(null),
  actorType: AuditActorTypeSchema.optional().nullable().default(null),
  actorName: z.string().max(255).optional().nullable().default(null),
  actorEmail: z.string().email().max(320).optional().nullable().default(null),
  action: z.string().min(1).max(64),
  resourceType: z.string().min(1).max(64),
  resourceId: z.string().max(64).optional().nullable().default(null),
  targetLabel: z.string().max(255).optional().nullable().default(null),
  result: AuditResultSchema.default('SUCCESS'),
  beforeJson: JsonValueSchema.optional().nullable().default(null),
  afterJson: JsonValueSchema.optional().nullable().default(null),
  metadata: JsonValueSchema.optional().nullable().default(null),
  ip: z.string().max(64).optional().nullable().default(null),
  userAgent: z.string().max(512).optional().nullable().default(null),
  correlationId: z.string().max(64).optional(),
});

export const CreateAuditLogSchema = z.preprocess(preprocessAuditPayload, CreateAuditLogBodySchema);

export const AuditLogQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    return preprocessAuditPayload(input);
  },
  z.object({
    search: z.string().optional(),
    actorId: z.string().optional(),
    actorName: z.string().optional(),
    actorEmail: z.string().optional(),
    actorType: AuditActorTypeSchema.optional(),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    corporateId: z.string().optional(),
    result: AuditResultSchema.optional(),
    correlationId: z.string().optional(),
    ip: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export type CreateAuditLogDto = z.output<typeof CreateAuditLogBodySchema>;
export type AuditLogQueryDto = {
  search?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorType?: z.infer<typeof AuditActorTypeSchema>;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  corporateId?: string;
  result?: z.infer<typeof AuditResultSchema>;
  correlationId?: string;
  ip?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
};

export interface AuditLogRecord {
  id: string;
  corporateId: string | null;
  actorId: string | null;
  actorType: z.infer<typeof AuditActorTypeSchema> | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  targetLabel: string | null;
  result: z.infer<typeof AuditResultSchema>;
  beforeJson: unknown | null;
  afterJson: unknown | null;
  metadata: unknown | null;
  ip: string | null;
  userAgent: string | null;
  correlationId: string;
  createdAt: string;
  /** Supervision history-table aliases */
  when: string;
  actor: string;
  target: string;
}

export interface AuditLogListResponse {
  items: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogSummary {
  total: number;
  success: number;
  denied: number;
  failed: number;
  last24Hours: number;
}

export const AuditLogRecordSchema = z.object({
  id: z.string(),
  corporateId: z.string().nullable(),
  actorId: z.string().nullable(),
  actorType: AuditActorTypeSchema.nullable(),
  actorName: z.string().nullable(),
  actorEmail: z.string().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  targetLabel: z.string().nullable(),
  result: AuditResultSchema,
  beforeJson: z.unknown().nullable(),
  afterJson: z.unknown().nullable(),
  metadata: z.unknown().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  correlationId: z.string(),
  createdAt: z.string(),
  when: z.string(),
  actor: z.string(),
  target: z.string(),
});

export const AuditLogListResponseSchema = z.object({
  items: z.array(AuditLogRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const AuditLogSummarySchema = z.object({
  total: z.number().int(),
  success: z.number().int(),
  denied: z.number().int(),
  failed: z.number().int(),
  last24Hours: z.number().int(),
});
