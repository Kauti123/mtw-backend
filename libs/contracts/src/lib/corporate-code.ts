import { z } from 'zod';

const CORPORATE_CODE_PATTERN = /^[A-Z0-9_-]+$/;

export const CorporateCodeStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const CorporateCodeTypeSchema = z.enum([
  'CLIENT',
  'PARTNER',
  'VENDOR',
  'INTERNAL',
  'AFFILIATE',
]);
export const PricingModelSchema = z.enum(['MARKUP', 'MARKDOWN', 'NET', 'COMMISSION', 'FLAT_FEE']);

const STATUS_ALIASES: Record<string, z.infer<typeof CorporateCodeStatusSchema>> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  true: 'ACTIVE',
  false: 'INACTIVE',
};

const TYPE_ALIASES: Record<string, z.infer<typeof CorporateCodeTypeSchema>> = {
  CLIENT: 'CLIENT',
  PARTNER: 'PARTNER',
  VENDOR: 'VENDOR',
  INTERNAL: 'INTERNAL',
  AFFILIATE: 'AFFILIATE',
  Client: 'CLIENT',
  Partner: 'PARTNER',
  Vendor: 'VENDOR',
  Internal: 'INTERNAL',
  Affiliate: 'AFFILIATE',
};

const PRICING_ALIASES: Record<string, z.infer<typeof PricingModelSchema>> = {
  MARKUP: 'MARKUP',
  MARKDOWN: 'MARKDOWN',
  NET: 'NET',
  COMMISSION: 'COMMISSION',
  FLAT_FEE: 'FLAT_FEE',
  Markup: 'MARKUP',
  Markdown: 'MARKDOWN',
  Net: 'NET',
  Commission: 'COMMISSION',
  'Flat Fee': 'FLAT_FEE',
  FLATFEE: 'FLAT_FEE',
};

function normalizeGst(value: unknown): unknown {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true' || normalized === '1') return true;
  if (normalized === 'no' || normalized === 'false' || normalized === '0') return false;
  return value;
}

function normalizeStatus(value: unknown): unknown {
  if (typeof value === 'boolean') return value ? 'ACTIVE' : 'INACTIVE';
  if (typeof value !== 'string') return value;
  return STATUS_ALIASES[value] ?? STATUS_ALIASES[value.toUpperCase()] ?? value;
}

function preprocessCorporateCodePayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['corporateCode'] && !copy['code']) copy['code'] = copy['corporateCode'];
  if (copy['corporateName'] && !copy['name']) copy['name'] = copy['corporateName'];
  if (copy['type'] && !copy['corporateType']) copy['corporateType'] = copy['type'];
  if (copy['country'] && !copy['defaultCountry']) copy['defaultCountry'] = copy['country'];
  if (copy['currency'] && !copy['defaultCurrency']) {
    copy['defaultCurrency'] = copy['currency'];
  }
  if (copy['primaryContactName'] && !copy['primaryContact']) {
    copy['primaryContact'] = copy['primaryContactName'];
  }

  if (typeof copy['code'] === 'string') copy['code'] = copy['code'].trim().toUpperCase();
  if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
  if (typeof copy['defaultCountry'] === 'string') {
    copy['defaultCountry'] = copy['defaultCountry'].trim();
  }
  if (typeof copy['defaultCurrency'] === 'string') {
    const currency = copy['defaultCurrency'].trim().toUpperCase();
    copy['defaultCurrency'] = currency.includes('-')
      ? (currency.split('-')[0]?.trim() ?? currency)
      : currency.slice(0, 3);
  }
  if (typeof copy['email'] === 'string') {
    const email = copy['email'].trim().toLowerCase();
    copy['email'] = email.length === 0 ? null : email;
  }
  if (typeof copy['phone'] === 'string') {
    const phone = copy['phone'].trim();
    copy['phone'] = phone.length === 0 ? null : phone;
  }
  if (typeof copy['remarks'] === 'string') {
    const remarks = copy['remarks'].trim();
    copy['remarks'] = remarks.length === 0 ? null : remarks;
  }
  if (typeof copy['primaryContact'] === 'string') {
    const contact = copy['primaryContact'].trim();
    copy['primaryContact'] = contact.length === 0 ? null : contact;
  }

  if (copy['corporateType'] !== undefined) {
    const value = copy['corporateType'];
    if (typeof value === 'string') {
      copy['corporateType'] =
        TYPE_ALIASES[value] ?? TYPE_ALIASES[value.toUpperCase()] ?? value.toUpperCase();
    }
  }
  if (copy['pricingModel'] !== undefined) {
    const value = copy['pricingModel'];
    if (typeof value === 'string') {
      copy['pricingModel'] =
        PRICING_ALIASES[value] ??
        PRICING_ALIASES[value.toUpperCase()] ??
        value.toUpperCase().replace(/\s+/g, '_');
    }
  }
  if (copy['gstApplicable'] !== undefined) {
    copy['gstApplicable'] = normalizeGst(copy['gstApplicable']);
  }
  if (copy['status'] !== undefined) {
    copy['status'] = normalizeStatus(copy['status']);
  }

  return copy;
}

export const BaseCorporateCodeSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(CORPORATE_CODE_PATTERN, 'Use uppercase letters, numbers, underscore or hyphen'),
  name: z.string().min(1).max(255),
  corporateType: CorporateCodeTypeSchema.default('CLIENT'),
  defaultCountry: z.string().min(1).max(64).default('India'),
  defaultCurrency: z.string().length(3).default('INR'),
  pricingModel: PricingModelSchema.default('MARKUP'),
  gstApplicable: z.boolean().default(true),
  status: CorporateCodeStatusSchema.default('ACTIVE'),
  primaryContact: z.string().max(128).optional().nullable().default(null),
  email: z.string().email().max(320).optional().nullable().default(null),
  phone: z.string().max(32).optional().nullable().default(null),
  remarks: z.string().max(2000).optional().nullable().default(null),
});

export const CreateCorporateCodeSchema = z.preprocess(
  preprocessCorporateCodePayload,
  BaseCorporateCodeSchema,
);

export const UpdateCorporateCodeSchema = z.preprocess(
  preprocessCorporateCodePayload,
  BaseCorporateCodeSchema.partial(),
);

export const CorporateCodeQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
    if (copy['corporateType'] !== undefined) {
      const value = copy['corporateType'];
      if (typeof value === 'string') {
        copy['corporateType'] = TYPE_ALIASES[value] ?? TYPE_ALIASES[value.toUpperCase()] ?? value;
      }
    }
    if (copy['pricingModel'] !== undefined) {
      const value = copy['pricingModel'];
      if (typeof value === 'string') {
        copy['pricingModel'] =
          PRICING_ALIASES[value] ?? PRICING_ALIASES[value.toUpperCase()] ?? value;
      }
    }
    return copy;
  },
  z.object({
    search: z.string().optional(),
    status: CorporateCodeStatusSchema.optional(),
    corporateType: CorporateCodeTypeSchema.optional(),
    pricingModel: PricingModelSchema.optional(),
    defaultCountry: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const UpdateCorporateCodeStatusBodySchema = z.object({
  status: CorporateCodeStatusSchema,
  reason: z.string().optional(),
});

export const UpdateCorporateCodeStatusSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };
  if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
  return copy;
}, UpdateCorporateCodeStatusBodySchema);

export type CreateCorporateCodeDto = z.output<typeof BaseCorporateCodeSchema>;
export type UpdateCorporateCodeDto = Partial<CreateCorporateCodeDto>;
export type CorporateCodeQueryDto = {
  search?: string;
  status?: z.infer<typeof CorporateCodeStatusSchema>;
  corporateType?: z.infer<typeof CorporateCodeTypeSchema>;
  pricingModel?: z.infer<typeof PricingModelSchema>;
  defaultCountry?: string;
  page: number;
  limit: number;
};
export type UpdateCorporateCodeStatusDto = z.infer<typeof UpdateCorporateCodeStatusBodySchema>;

export interface CorporateCodeRecord {
  id: string;
  code: string;
  name: string;
  corporateType: z.infer<typeof CorporateCodeTypeSchema>;
  defaultCountry: string;
  defaultCurrency: string;
  pricingModel: z.infer<typeof PricingModelSchema>;
  gstApplicable: boolean;
  status: z.infer<typeof CorporateCodeStatusSchema>;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateCodeListResponse {
  items: CorporateCodeRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const CorporateCodeRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  corporateType: CorporateCodeTypeSchema,
  defaultCountry: z.string(),
  defaultCurrency: z.string(),
  pricingModel: PricingModelSchema,
  gstApplicable: z.boolean(),
  status: CorporateCodeStatusSchema,
  primaryContact: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  remarks: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CorporateCodeListResponseSchema = z.object({
  items: z.array(CorporateCodeRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const CorporateCodeUniqueCheckSchema = z.object({
  code: z.string(),
  available: z.boolean(),
});

export const CorporateCodeDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});
