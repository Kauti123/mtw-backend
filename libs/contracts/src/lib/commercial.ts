import { z } from 'zod';

export const CommercialStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const AmountTypeSchema = z.enum(['PERCENTAGE', 'FIXED']);
export const TravelProductTypeSchema = z.enum([
  'FLIGHT',
  'HOTEL',
  'CAR',
  'TRAIN',
  'BUS',
  'ALL',
]);
export const CoreTravelProductTypeSchema = z.enum([
  'FLIGHT',
  'HOTEL',
  'CAR',
  'TRAIN',
  'BUS',
]);
export const ServiceFeeProductTypeSchema = z.enum([
  'FLIGHT',
  'HOTEL',
  'VISA',
  'INSURANCE',
  'OTHER',
  'CAR',
  'TRAIN',
  'BUS',
]);
export const FeeApplicableToSchema = z.enum(['ALL_AGENTS', 'CORPORATE']);
export const ConvenienceChannelSchema = z.enum([
  'WEB',
  'MOBILE_APP',
  'AGENT_PORTAL',
  'OFFLINE',
  'ALL',
]);
export const GstTypeSchema = z.enum(['GST', 'IGST', 'CGST', 'SGST']);
export const GstApplicableForSchema = z.enum(['DOMESTIC', 'INTERNATIONAL']);

const STATUS_ALIASES: Record<string, z.infer<typeof CommercialStatusSchema>> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
};

const AMOUNT_ALIASES: Record<string, z.infer<typeof AmountTypeSchema>> = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
  Percentage: 'PERCENTAGE',
  Fixed: 'FIXED',
};

const PRODUCT_ALIASES: Record<string, string> = {
  FLIGHT: 'FLIGHT',
  HOTEL: 'HOTEL',
  CAR: 'CAR',
  TRAIN: 'TRAIN',
  BUS: 'BUS',
  ALL: 'ALL',
  VISA: 'VISA',
  INSURANCE: 'INSURANCE',
  OTHER: 'OTHER',
  Flight: 'FLIGHT',
  Hotel: 'HOTEL',
  Car: 'CAR',
  Train: 'TRAIN',
  Bus: 'BUS',
  All: 'ALL',
  Visa: 'VISA',
  Insurance: 'INSURANCE',
  Other: 'OTHER',
  Others: 'OTHER',
};

const APPLICABLE_ALIASES: Record<string, z.infer<typeof FeeApplicableToSchema>> = {
  ALL_AGENTS: 'ALL_AGENTS',
  CORPORATE: 'CORPORATE',
  'All Agents': 'ALL_AGENTS',
  Corporate: 'CORPORATE',
};

const CHANNEL_ALIASES: Record<string, z.infer<typeof ConvenienceChannelSchema>> = {
  WEB: 'WEB',
  MOBILE_APP: 'MOBILE_APP',
  AGENT_PORTAL: 'AGENT_PORTAL',
  OFFLINE: 'OFFLINE',
  ALL: 'ALL',
  Web: 'WEB',
  'Mobile App': 'MOBILE_APP',
  'Agent Portal': 'AGENT_PORTAL',
  Offline: 'OFFLINE',
  All: 'ALL',
};

const GST_TYPE_ALIASES: Record<string, z.infer<typeof GstTypeSchema>> = {
  GST: 'GST',
  IGST: 'IGST',
  CGST: 'CGST',
  SGST: 'SGST',
};

const GST_FOR_ALIASES: Record<string, z.infer<typeof GstApplicableForSchema>> = {
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL',
  Domestic: 'DOMESTIC',
  International: 'INTERNATIONAL',
};

function parseDateInput(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
  }
  const dMonY = /^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(trimmed);
  if (dMonY) {
    const [, dd, mon, yyyy] = dMonY;
    const parsed = new Date(`${dd} ${mon} ${yyyy} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function normalizeCommon(copy: Record<string, unknown>): Record<string, unknown> {
  if (typeof copy['status'] === 'string') {
    copy['status'] = STATUS_ALIASES[copy['status']] ?? copy['status'];
  }
  if (typeof copy['productType'] === 'string') {
    copy['productType'] =
      PRODUCT_ALIASES[copy['productType']] ??
      copy['productType'].toUpperCase();
  }
  if (typeof copy['value'] === 'string') {
    copy['value'] = Number(String(copy['value']).replace(/[%₹,\s]/g, ''));
  }
  if (typeof copy['gstPercentage'] === 'string') {
    copy['gstPercentage'] = Number(
      String(copy['gstPercentage']).replace(/[%₹,\s]/g, ''),
    );
  }
  if (typeof copy['minBookingValue'] === 'string') {
    copy['minBookingValue'] = Number(
      String(copy['minBookingValue']).replace(/[%₹,\s]/g, ''),
    );
  }
  if (copy['validFrom'] !== undefined) copy['validFrom'] = parseDateInput(copy['validFrom']);
  if (copy['validTo'] !== undefined) copy['validTo'] = parseDateInput(copy['validTo']);
  if (typeof copy['remarks'] === 'string') {
    const remarks = copy['remarks'].trim();
    copy['remarks'] = remarks.length === 0 ? null : remarks;
  }
  return copy;
}

function preprocess(input: unknown, extra?: (c: Record<string, unknown>) => void) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = normalizeCommon({ ...(input as Record<string, unknown>) });
  extra?.(copy);
  return copy;
}

const listMeta = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

// ─── Supplier Commission ─────────────────────────────────────

export const BaseSupplierCommissionSchema = z.object({
  supplierName: z.string().min(1).max(128),
  productType: CoreTravelProductTypeSchema,
  commissionType: AmountTypeSchema.default('PERCENTAGE'),
  value: z.number().nonnegative(),
  validFrom: z.string().datetime().optional().nullable().default(null),
  validTo: z.string().datetime().optional().nullable().default(null),
  status: CommercialStatusSchema.default('ACTIVE'),
  remarks: z.string().max(2000).optional().nullable().default(null),
});

export const CreateSupplierCommissionSchema = z.preprocess(
  (input) =>
    preprocess(input, (copy) => {
      if (copy['supplier'] && !copy['supplierName']) copy['supplierName'] = copy['supplier'];
      if (typeof copy['commissionType'] === 'string') {
        copy['commissionType'] =
          AMOUNT_ALIASES[copy['commissionType']] ?? copy['commissionType'];
      }
      if (typeof copy['supplierName'] === 'string') {
        copy['supplierName'] = copy['supplierName'].trim();
      }
    }),
  BaseSupplierCommissionSchema,
);

export const UpdateSupplierCommissionSchema = z.preprocess(
  (input) =>
    preprocess(input, (copy) => {
      if (copy['supplier'] && !copy['supplierName']) copy['supplierName'] = copy['supplier'];
      if (typeof copy['commissionType'] === 'string') {
        copy['commissionType'] =
          AMOUNT_ALIASES[copy['commissionType']] ?? copy['commissionType'];
      }
    }),
  BaseSupplierCommissionSchema.partial(),
);

export const SupplierCommissionQuerySchema = z.preprocess(
  (input) => preprocess(input),
  z.object({
    search: z.string().optional(),
    supplierName: z.string().optional(),
    productType: CoreTravelProductTypeSchema.optional(),
    status: CommercialStatusSchema.optional(),
    ...listMeta,
  }),
);

export type CreateSupplierCommissionDto = z.output<typeof BaseSupplierCommissionSchema>;
export type UpdateSupplierCommissionDto = Partial<CreateSupplierCommissionDto>;
export type SupplierCommissionQueryDto = {
  search?: string;
  supplierName?: string;
  productType?: z.infer<typeof CoreTravelProductTypeSchema>;
  status?: z.infer<typeof CommercialStatusSchema>;
  page: number;
  limit: number;
};

export interface SupplierCommissionRecord extends CreateSupplierCommissionDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const SupplierCommissionRecordSchema = BaseSupplierCommissionSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SupplierCommissionListResponseSchema = z.object({
  items: z.array(SupplierCommissionRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

// ─── Service Fee ─────────────────────────────────────────────

export const BaseServiceFeeSchema = z.object({
  feeName: z.string().min(1).max(128),
  productType: ServiceFeeProductTypeSchema,
  feeType: AmountTypeSchema.default('FIXED'),
  value: z.number().nonnegative(),
  applicableTo: FeeApplicableToSchema.default('ALL_AGENTS'),
  status: CommercialStatusSchema.default('ACTIVE'),
  remarks: z.string().max(2000).optional().nullable().default(null),
});

export const CreateServiceFeeSchema = z.preprocess(
  (input) =>
    preprocess(input, (copy) => {
      if (copy['name'] && !copy['feeName']) copy['feeName'] = copy['name'];
      if (typeof copy['feeName'] === 'string') copy['feeName'] = copy['feeName'].trim();
      if (typeof copy['feeType'] === 'string') {
        copy['feeType'] = AMOUNT_ALIASES[copy['feeType']] ?? copy['feeType'];
      }
      if (typeof copy['applicableTo'] === 'string') {
        copy['applicableTo'] =
          APPLICABLE_ALIASES[copy['applicableTo']] ?? copy['applicableTo'];
      }
    }),
  BaseServiceFeeSchema,
);

export const UpdateServiceFeeSchema = z.preprocess(
  (input) => preprocess(input),
  BaseServiceFeeSchema.partial(),
);

export const ServiceFeeQuerySchema = z.preprocess(
  (input) => preprocess(input),
  z.object({
    search: z.string().optional(),
    productType: ServiceFeeProductTypeSchema.optional(),
    status: CommercialStatusSchema.optional(),
    ...listMeta,
  }),
);

export type CreateServiceFeeDto = z.output<typeof BaseServiceFeeSchema>;
export type UpdateServiceFeeDto = Partial<CreateServiceFeeDto>;
export type ServiceFeeQueryDto = {
  search?: string;
  productType?: z.infer<typeof ServiceFeeProductTypeSchema>;
  status?: z.infer<typeof CommercialStatusSchema>;
  page: number;
  limit: number;
};

export interface ServiceFeeRecord extends CreateServiceFeeDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const ServiceFeeRecordSchema = BaseServiceFeeSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ServiceFeeListResponseSchema = z.object({
  items: z.array(ServiceFeeRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

// ─── Convenience Fee ─────────────────────────────────────────

export const BaseConvenienceFeeSchema = z.object({
  feeName: z.string().min(1).max(128),
  productType: TravelProductTypeSchema,
  channel: ConvenienceChannelSchema.default('WEB'),
  value: z.number().nonnegative(),
  applicableTo: FeeApplicableToSchema.default('ALL_AGENTS'),
  status: CommercialStatusSchema.default('ACTIVE'),
  remarks: z.string().max(2000).optional().nullable().default(null),
});

export const CreateConvenienceFeeSchema = z.preprocess(
  (input) =>
    preprocess(input, (copy) => {
      if (copy['name'] && !copy['feeName']) copy['feeName'] = copy['name'];
      if (typeof copy['feeName'] === 'string') copy['feeName'] = copy['feeName'].trim();
      if (typeof copy['channel'] === 'string') {
        copy['channel'] = CHANNEL_ALIASES[copy['channel']] ?? copy['channel'];
      }
      if (typeof copy['applicableTo'] === 'string') {
        copy['applicableTo'] =
          APPLICABLE_ALIASES[copy['applicableTo']] ?? copy['applicableTo'];
      }
    }),
  BaseConvenienceFeeSchema,
);

export const UpdateConvenienceFeeSchema = z.preprocess(
  (input) => preprocess(input),
  BaseConvenienceFeeSchema.partial(),
);

export const ConvenienceFeeQuerySchema = z.preprocess(
  (input) => preprocess(input),
  z.object({
    search: z.string().optional(),
    productType: TravelProductTypeSchema.optional(),
    channel: ConvenienceChannelSchema.optional(),
    status: CommercialStatusSchema.optional(),
    ...listMeta,
  }),
);

export type CreateConvenienceFeeDto = z.output<typeof BaseConvenienceFeeSchema>;
export type UpdateConvenienceFeeDto = Partial<CreateConvenienceFeeDto>;
export type ConvenienceFeeQueryDto = {
  search?: string;
  productType?: z.infer<typeof TravelProductTypeSchema>;
  channel?: z.infer<typeof ConvenienceChannelSchema>;
  status?: z.infer<typeof CommercialStatusSchema>;
  page: number;
  limit: number;
};

export interface ConvenienceFeeRecord extends CreateConvenienceFeeDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const ConvenienceFeeRecordSchema = BaseConvenienceFeeSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ConvenienceFeeListResponseSchema = z.object({
  items: z.array(ConvenienceFeeRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

// ─── Discount Rule ───────────────────────────────────────────

export const BaseDiscountRuleSchema = z.object({
  name: z.string().min(1).max(128),
  productType: TravelProductTypeSchema,
  discountType: AmountTypeSchema.default('PERCENTAGE'),
  value: z.number().nonnegative(),
  minBookingValue: z.number().nonnegative().default(0),
  validFrom: z.string().datetime().optional().nullable().default(null),
  validTo: z.string().datetime().optional().nullable().default(null),
  status: CommercialStatusSchema.default('ACTIVE'),
  remarks: z.string().max(2000).optional().nullable().default(null),
});

export const CreateDiscountRuleSchema = z.preprocess(
  (input) =>
    preprocess(input, (copy) => {
      if (copy['ruleName'] && !copy['name']) copy['name'] = copy['ruleName'];
      if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
      if (typeof copy['discountType'] === 'string') {
        copy['discountType'] =
          AMOUNT_ALIASES[copy['discountType']] ?? copy['discountType'];
      }
    }),
  BaseDiscountRuleSchema,
);

export const UpdateDiscountRuleSchema = z.preprocess(
  (input) => preprocess(input),
  BaseDiscountRuleSchema.partial(),
);

export const DiscountRuleQuerySchema = z.preprocess(
  (input) => preprocess(input),
  z.object({
    search: z.string().optional(),
    productType: TravelProductTypeSchema.optional(),
    discountType: AmountTypeSchema.optional(),
    status: CommercialStatusSchema.optional(),
    ...listMeta,
  }),
);

export type CreateDiscountRuleDto = z.output<typeof BaseDiscountRuleSchema>;
export type UpdateDiscountRuleDto = Partial<CreateDiscountRuleDto>;
export type DiscountRuleQueryDto = {
  search?: string;
  productType?: z.infer<typeof TravelProductTypeSchema>;
  discountType?: z.infer<typeof AmountTypeSchema>;
  status?: z.infer<typeof CommercialStatusSchema>;
  page: number;
  limit: number;
};

export interface DiscountRuleRecord extends CreateDiscountRuleDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const DiscountRuleRecordSchema = BaseDiscountRuleSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DiscountRuleListResponseSchema = z.object({
  items: z.array(DiscountRuleRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

// ─── GST Rule ────────────────────────────────────────────────

export const BaseGstRuleSchema = z.object({
  name: z.string().min(1).max(128),
  productType: CoreTravelProductTypeSchema,
  gstType: GstTypeSchema.default('GST'),
  gstPercentage: z.number().min(0).max(100),
  applicableFor: GstApplicableForSchema.default('DOMESTIC'),
  status: CommercialStatusSchema.default('ACTIVE'),
  remarks: z.string().max(2000).optional().nullable().default(null),
});

export const CreateGstRuleSchema = z.preprocess(
  (input) =>
    preprocess(input, (copy) => {
      if (copy['ruleName'] && !copy['name']) copy['name'] = copy['ruleName'];
      if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
      if (typeof copy['gstType'] === 'string') {
        copy['gstType'] = GST_TYPE_ALIASES[copy['gstType']] ?? copy['gstType'];
      }
      if (typeof copy['applicableFor'] === 'string') {
        copy['applicableFor'] =
          GST_FOR_ALIASES[copy['applicableFor']] ?? copy['applicableFor'];
      }
    }),
  BaseGstRuleSchema,
);

export const UpdateGstRuleSchema = z.preprocess(
  (input) => preprocess(input),
  BaseGstRuleSchema.partial(),
);

export const GstRuleQuerySchema = z.preprocess(
  (input) => preprocess(input),
  z.object({
    search: z.string().optional(),
    productType: CoreTravelProductTypeSchema.optional(),
    status: CommercialStatusSchema.optional(),
    ...listMeta,
  }),
);

export type CreateGstRuleDto = z.output<typeof BaseGstRuleSchema>;
export type UpdateGstRuleDto = Partial<CreateGstRuleDto>;
export type GstRuleQueryDto = {
  search?: string;
  productType?: z.infer<typeof CoreTravelProductTypeSchema>;
  status?: z.infer<typeof CommercialStatusSchema>;
  page: number;
  limit: number;
};

export interface GstRuleRecord extends CreateGstRuleDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const GstRuleRecordSchema = BaseGstRuleSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GstRuleListResponseSchema = z.object({
  items: z.array(GstRuleRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const CommercialDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});

export const UpdateCommercialStatusBodySchema = z.object({
  status: CommercialStatusSchema,
  reason: z.string().optional(),
});

export const UpdateCommercialStatusSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  return normalizeCommon({ ...(input as Record<string, unknown>) });
}, UpdateCommercialStatusBodySchema);

export type UpdateCommercialStatusDto = z.infer<typeof UpdateCommercialStatusBodySchema>;
export type CommercialListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
