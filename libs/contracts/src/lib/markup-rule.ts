import { z } from 'zod';

export const MarkupProductTypeSchema = z.enum([
  'FLIGHT',
  'HOTEL',
  'CAR',
  'TRAIN',
  'BUS',
]);

export const MarkupTypeSchema = z.enum(['PERCENTAGE', 'FIXED']);

export const MarkupApplicableToSchema = z.enum([
  'ALL_AGENTS',
  'SPECIFIC_AGENTS',
  'ALL_CORPORATES',
  'SPECIFIC_CORPORATES',
  'ALL_EMPLOYEES',
]);

export const MarkupRuleStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

const PRODUCT_ALIASES: Record<string, z.infer<typeof MarkupProductTypeSchema>> = {
  FLIGHT: 'FLIGHT',
  HOTEL: 'HOTEL',
  CAR: 'CAR',
  TRAIN: 'TRAIN',
  BUS: 'BUS',
  Flight: 'FLIGHT',
  Hotel: 'HOTEL',
  Car: 'CAR',
  Train: 'TRAIN',
  Bus: 'BUS',
  flight: 'FLIGHT',
  hotel: 'HOTEL',
  car: 'CAR',
  train: 'TRAIN',
  bus: 'BUS',
};

const MARKUP_TYPE_ALIASES: Record<string, z.infer<typeof MarkupTypeSchema>> = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
  Percentage: 'PERCENTAGE',
  Fixed: 'FIXED',
  'Fixed Amount': 'FIXED',
  FIXED_AMOUNT: 'FIXED',
};

const APPLICABLE_ALIASES: Record<string, z.infer<typeof MarkupApplicableToSchema>> = {
  ALL_AGENTS: 'ALL_AGENTS',
  SPECIFIC_AGENTS: 'SPECIFIC_AGENTS',
  ALL_CORPORATES: 'ALL_CORPORATES',
  SPECIFIC_CORPORATES: 'SPECIFIC_CORPORATES',
  ALL_EMPLOYEES: 'ALL_EMPLOYEES',
  'All Agents': 'ALL_AGENTS',
  'Specific Agents': 'SPECIFIC_AGENTS',
  'All Corporates': 'ALL_CORPORATES',
  'Specific Corporates': 'SPECIFIC_CORPORATES',
  'All Employees': 'ALL_EMPLOYEES',
};

const STATUS_ALIASES: Record<string, z.infer<typeof MarkupRuleStatusSchema>> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
};

export const MarkupConditionSchema = z.object({
  field: z.string().min(1).max(64),
  operator: z
    .enum(['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'CONTAINS'])
    .default('EQ'),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

function parseDateInput(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  // DD/MM/YYYY from UI date pickers
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return value;
}

function preprocessMarkupRulePayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['ruleName'] && !copy['name']) copy['name'] = copy['ruleName'];
  if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
  if (typeof copy['remarks'] === 'string') {
    const remarks = copy['remarks'].trim();
    copy['remarks'] = remarks.length === 0 ? null : remarks;
  }

  if (copy['productType'] !== undefined && typeof copy['productType'] === 'string') {
    copy['productType'] =
      PRODUCT_ALIASES[copy['productType']] ??
      PRODUCT_ALIASES[copy['productType'].toUpperCase()] ??
      copy['productType'].toUpperCase();
  }
  if (copy['markupType'] !== undefined && typeof copy['markupType'] === 'string') {
    copy['markupType'] =
      MARKUP_TYPE_ALIASES[copy['markupType']] ??
      MARKUP_TYPE_ALIASES[copy['markupType'].toUpperCase()] ??
      copy['markupType'].toUpperCase();
  }
  if (copy['applicableTo'] !== undefined && typeof copy['applicableTo'] === 'string') {
    copy['applicableTo'] =
      APPLICABLE_ALIASES[copy['applicableTo']] ??
      APPLICABLE_ALIASES[copy['applicableTo'].toUpperCase()] ??
      copy['applicableTo'].toUpperCase().replace(/\s+/g, '_');
  }
  if (copy['status'] !== undefined && typeof copy['status'] === 'string') {
    copy['status'] =
      STATUS_ALIASES[copy['status']] ??
      STATUS_ALIASES[copy['status'].toUpperCase()] ??
      copy['status'];
  }
  if (copy['validFrom'] !== undefined) copy['validFrom'] = parseDateInput(copy['validFrom']);
  if (copy['validTo'] !== undefined) copy['validTo'] = parseDateInput(copy['validTo']);
  if (copy['markupValue'] !== undefined && typeof copy['markupValue'] === 'string') {
    copy['markupValue'] = Number(copy['markupValue']);
  }
  if (copy['priority'] !== undefined && typeof copy['priority'] === 'string') {
    copy['priority'] = Number(copy['priority']);
  }

  return copy;
}

export const BaseMarkupRuleSchema = z
  .object({
    name: z.string().min(1).max(128),
    productType: MarkupProductTypeSchema,
    markupType: MarkupTypeSchema.default('PERCENTAGE'),
    markupValue: z.number().nonnegative(),
    applicableTo: MarkupApplicableToSchema.default('ALL_AGENTS'),
    priority: z.number().int().min(1).default(1),
    validFrom: z.string().datetime().optional().nullable().default(null),
    validTo: z.string().datetime().optional().nullable().default(null),
    status: MarkupRuleStatusSchema.default('ACTIVE'),
    conditions: z.array(MarkupConditionSchema).optional().default([]),
    remarks: z.string().max(2000).optional().nullable().default(null),
    corporateId: z.string().max(64).optional().nullable().default(null),
  })
  .refine(
    (value) => {
      if (!value.validFrom || !value.validTo) return true;
      return new Date(value.validFrom).getTime() <= new Date(value.validTo).getTime();
    },
    { message: 'validFrom must be before or equal to validTo', path: ['validTo'] },
  )
  .refine(
    (value) => {
      if (value.markupType === 'PERCENTAGE') return value.markupValue <= 100;
      return true;
    },
    { message: 'Percentage markup cannot exceed 100', path: ['markupValue'] },
  );

export const MarkupRuleBodySchema = z.object({
  name: z.string().min(1).max(128),
  productType: MarkupProductTypeSchema,
  markupType: MarkupTypeSchema.default('PERCENTAGE'),
  markupValue: z.number().nonnegative(),
  applicableTo: MarkupApplicableToSchema.default('ALL_AGENTS'),
  priority: z.number().int().min(1).default(1),
  validFrom: z.string().datetime().optional().nullable().default(null),
  validTo: z.string().datetime().optional().nullable().default(null),
  status: MarkupRuleStatusSchema.default('ACTIVE'),
  conditions: z.array(MarkupConditionSchema).optional().default([]),
  remarks: z.string().max(2000).optional().nullable().default(null),
  corporateId: z.string().max(64).optional().nullable().default(null),
});

export const CreateMarkupRuleSchema = z.preprocess(
  preprocessMarkupRulePayload,
  BaseMarkupRuleSchema,
);

export const UpdateMarkupRuleSchema = z.preprocess(
  preprocessMarkupRulePayload,
  MarkupRuleBodySchema.partial(),
);

export const MarkupRuleQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (typeof copy['productType'] === 'string') {
      copy['productType'] =
        PRODUCT_ALIASES[copy['productType']] ??
        PRODUCT_ALIASES[copy['productType'].toUpperCase()] ??
        copy['productType'];
    }
    if (typeof copy['markupType'] === 'string') {
      copy['markupType'] =
        MARKUP_TYPE_ALIASES[copy['markupType']] ??
        MARKUP_TYPE_ALIASES[copy['markupType'].toUpperCase()] ??
        copy['markupType'];
    }
    if (typeof copy['applicableTo'] === 'string') {
      copy['applicableTo'] =
        APPLICABLE_ALIASES[copy['applicableTo']] ?? copy['applicableTo'];
    }
    if (typeof copy['status'] === 'string') {
      copy['status'] = STATUS_ALIASES[copy['status']] ?? copy['status'];
    }
    return copy;
  },
  z.object({
    search: z.string().optional(),
    productType: MarkupProductTypeSchema.optional(),
    markupType: MarkupTypeSchema.optional(),
    applicableTo: MarkupApplicableToSchema.optional(),
    status: MarkupRuleStatusSchema.optional(),
    corporateId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const UpdateMarkupRuleStatusBodySchema = z.object({
  status: MarkupRuleStatusSchema,
  reason: z.string().optional(),
});

export const UpdateMarkupRuleStatusSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };
  if (typeof copy['status'] === 'string') {
    copy['status'] = STATUS_ALIASES[copy['status']] ?? copy['status'];
  }
  return copy;
}, UpdateMarkupRuleStatusBodySchema);

export type MarkupConditionDto = z.infer<typeof MarkupConditionSchema>;
export type CreateMarkupRuleDto = z.output<typeof MarkupRuleBodySchema>;
export type UpdateMarkupRuleDto = Partial<CreateMarkupRuleDto>;
export type MarkupRuleQueryDto = {
  search?: string;
  productType?: z.infer<typeof MarkupProductTypeSchema>;
  markupType?: z.infer<typeof MarkupTypeSchema>;
  applicableTo?: z.infer<typeof MarkupApplicableToSchema>;
  status?: z.infer<typeof MarkupRuleStatusSchema>;
  corporateId?: string;
  page: number;
  limit: number;
};
export type UpdateMarkupRuleStatusDto = z.infer<typeof UpdateMarkupRuleStatusBodySchema>;

export interface MarkupRuleRecord {
  id: string;
  name: string;
  productType: z.infer<typeof MarkupProductTypeSchema>;
  markupType: z.infer<typeof MarkupTypeSchema>;
  markupValue: number;
  applicableTo: z.infer<typeof MarkupApplicableToSchema>;
  priority: number;
  validFrom: string | null;
  validTo: string | null;
  status: z.infer<typeof MarkupRuleStatusSchema>;
  conditions: MarkupConditionDto[];
  remarks: string | null;
  corporateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupRuleListResponse {
  items: MarkupRuleRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const MarkupRuleRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  productType: MarkupProductTypeSchema,
  markupType: MarkupTypeSchema,
  markupValue: z.number(),
  applicableTo: MarkupApplicableToSchema,
  priority: z.number().int(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  status: MarkupRuleStatusSchema,
  conditions: z.array(MarkupConditionSchema),
  remarks: z.string().nullable(),
  corporateId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MarkupRuleListResponseSchema = z.object({
  items: z.array(MarkupRuleRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const MarkupRuleDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});
