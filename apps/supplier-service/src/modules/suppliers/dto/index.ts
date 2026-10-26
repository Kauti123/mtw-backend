import { z } from 'zod';

export const SupplierStatusSchema = z.enum(['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED']);
export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;

export const CreateSupplierAccountSchema = z.object({
  companyName: z.string().trim().min(2).max(255),
  supplierCode: z.string().trim().min(2).max(64),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128).optional(),
  contactName: z.string().trim().max(128).optional().default(''),
  phone: z.string().trim().max(32).optional().default(''),
  website: z.string().trim().max(255).optional().default(''),
  gstNumber: z.string().trim().max(64).optional().default(''),
  country: z.string().trim().max(64).optional().default(''),
  city: z.string().trim().max(128).optional().default(''),
  address: z.string().trim().max(512).optional().default(''),
  verticals: z.array(z.string().trim().min(1)).optional().default([]),
  notes: z.string().trim().max(2000).optional().default(''),
});

export const UpdateSupplierAccountSchema = CreateSupplierAccountSchema.partial()
  .omit({
    password: true,
    confirmPassword: true,
  })
  .extend({
    password: z.string().min(8).max(128).optional(),
  });

export const SupplierQuerySchema = z.object({
  search: z.string().optional(),
  status: SupplierStatusSchema.optional(),
  vertical: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ValidateSupplierSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().trim().max(2000).optional().default(''),
});

export const UpdateSupplierStatusSchema = z.object({
  status: SupplierStatusSchema,
});

export const SupplierLoginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export type CreateSupplierAccountDto = z.infer<typeof CreateSupplierAccountSchema>;
export type UpdateSupplierAccountDto = z.infer<typeof UpdateSupplierAccountSchema>;
export type SupplierQueryDto = z.infer<typeof SupplierQuerySchema>;
export type ValidateSupplierDto = z.infer<typeof ValidateSupplierSchema>;
export type UpdateSupplierStatusDto = z.infer<typeof UpdateSupplierStatusSchema>;
export type SupplierLoginDto = z.infer<typeof SupplierLoginSchema>;

export type SupplierAccountRecord = {
  id: string;
  supplierCode: string;
  companyName: string;
  email: string;
  contactName: string;
  phone: string;
  website: string;
  gstNumber: string;
  country: string;
  city: string;
  address: string;
  verticals: string[];
  status: SupplierStatus;
  notes: string;
  validatedAt: string | null;
  validatedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  passwordConfigured: boolean;
};
