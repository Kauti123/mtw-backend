import { z } from 'zod';

export const EmployeeStatusSchema = z.enum(['ACTIVE', 'PENDING', 'INACTIVE']);
export const EmployeeGenderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const EmployeeAccessSchema = z.enum([
  'ON_BEHALF_EMPLOYEE',
  'ON_BEHALF_GUEST',
  'PERSONAL',
]);

const STATUS_ALIASES: Record<string, z.infer<typeof EmployeeStatusSchema>> = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  INACTIVE: 'INACTIVE',
  Active: 'ACTIVE',
  Pending: 'PENDING',
  Inactive: 'INACTIVE',
};

const GENDER_ALIASES: Record<string, z.infer<typeof EmployeeGenderSchema>> = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  Male: 'MALE',
  Female: 'FEMALE',
  Other: 'OTHER',
};

const ACCESS_ALIASES: Record<string, z.infer<typeof EmployeeAccessSchema>> = {
  ON_BEHALF_EMPLOYEE: 'ON_BEHALF_EMPLOYEE',
  ON_BEHALF_GUEST: 'ON_BEHALF_GUEST',
  PERSONAL: 'PERSONAL',
  'On Behalf Employee': 'ON_BEHALF_EMPLOYEE',
  'On Behalf Guest': 'ON_BEHALF_GUEST',
  Personal: 'PERSONAL',
};

function normalizeStatus(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return STATUS_ALIASES[value] ?? STATUS_ALIASES[value.toUpperCase()] ?? value;
}

function normalizeGender(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return GENDER_ALIASES[trimmed] ?? GENDER_ALIASES[trimmed.toUpperCase()] ?? trimmed;
}

function normalizeAccess(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item) => {
    if (typeof item !== 'string') return item;
    return ACCESS_ALIASES[item] ?? ACCESS_ALIASES[item.toUpperCase()] ?? item;
  });
}

function emptyToNull(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function preprocessEmployeePayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['employeeId'] && !copy['employeeCode']) copy['employeeCode'] = copy['employeeId'];
  if (copy['userStatus'] && !copy['status']) copy['status'] = copy['userStatus'];
  if (copy['corporate'] && !copy['corporateName']) copy['corporateName'] = copy['corporate'];
  if (copy['manager'] && !copy['managerName']) copy['managerName'] = copy['manager'];

  if (typeof copy['employeeCode'] === 'string') {
    copy['employeeCode'] = copy['employeeCode'].trim().toUpperCase();
  }
  if (typeof copy['email'] === 'string') {
    copy['email'] = copy['email'].trim().toLowerCase();
  }
  if (typeof copy['corporateCode'] === 'string') {
    copy['corporateCode'] = copy['corporateCode'].trim().toUpperCase();
  }
  if (typeof copy['corporateName'] === 'string') {
    copy['corporateName'] = copy['corporateName'].trim();
  }
  for (const key of [
    'title',
    'firstName',
    'lastName',
    'phone',
    'position',
    'department',
    'costCenter',
    'address',
    'city',
    'state',
    'pinCode',
  ] as const) {
    if (copy[key] !== undefined) copy[key] = emptyToNull(copy[key]);
  }
  if (copy['department'] !== undefined && copy['departmentName'] === undefined) {
    copy['departmentName'] = copy['department'];
  }
  if (copy['costCenter'] !== undefined && copy['costCenterName'] === undefined) {
    copy['costCenterName'] = copy['costCenter'];
  }
  if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
  if (copy['gender'] !== undefined) copy['gender'] = normalizeGender(copy['gender']);
  if (copy['access'] !== undefined) copy['access'] = normalizeAccess(copy['access']);

  return copy;
}

export const BaseEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(64),
  email: z.string().email().max(320),
  corporateId: z.string().min(1).optional(),
  corporateCode: z.string().min(1).max(64).optional(),
  corporateName: z.string().min(1).max(255).optional(),
  title: z.string().max(16).optional().nullable(),
  firstName: z.string().max(128).optional().nullable(),
  lastName: z.string().max(128).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  gender: EmployeeGenderSchema.optional().nullable(),
  position: z.string().max(128).optional().nullable(),
  departmentName: z.string().max(128).optional().nullable(),
  costCenterName: z.string().max(128).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(128).optional().nullable(),
  state: z.string().max(128).optional().nullable(),
  pinCode: z.string().max(16).optional().nullable(),
  access: z.array(EmployeeAccessSchema).default([]),
  status: EmployeeStatusSchema.default('ACTIVE'),
  grade: z.string().max(32).optional().nullable(),
  managerName: z.string().max(255).optional().nullable(),
  managerEmployeeId: z.string().max(64).optional().nullable(),
  isApprover: z.boolean().default(false),
  needsApprover: z.boolean().default(false),
  l1ApproverId: z.string().max(64).optional().nullable(),
  l2ApproverId: z.string().max(64).optional().nullable(),
  joinedAt: z.string().datetime().optional().nullable(),
});

export const CreateEmployeeSchema = z.preprocess(
  preprocessEmployeePayload,
  BaseEmployeeSchema.superRefine((value, ctx) => {
    if (!value.corporateId?.trim() && !value.corporateCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'corporateId is required to link the employee to a corporate account',
        path: ['corporateId'],
      });
    }
  }),
);

export const UpdateEmployeeSchema = z.preprocess(
  preprocessEmployeePayload,
  BaseEmployeeSchema.partial(),
);

export const EmployeeQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
    if (typeof copy['corporateCode'] === 'string') {
      copy['corporateCode'] = copy['corporateCode'].trim().toUpperCase();
    }
    if (copy['department'] !== undefined && copy['departmentName'] === undefined) {
      copy['departmentName'] = copy['department'];
    }
    return copy;
  },
  z.object({
    search: z.string().optional(),
    status: EmployeeStatusSchema.optional(),
    departmentName: z.string().optional(),
    position: z.string().optional(),
    corporateId: z.string().optional(),
    corporateCode: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const UpdateEmployeeStatusBodySchema = z.object({
  status: EmployeeStatusSchema,
  reason: z.string().optional(),
});

export const UpdateEmployeeStatusSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };
  if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
  return copy;
}, UpdateEmployeeStatusBodySchema);

export type CreateEmployeeDto = z.output<typeof BaseEmployeeSchema>;
export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;
export type EmployeeQueryDto = {
  search?: string;
  status?: z.infer<typeof EmployeeStatusSchema>;
  departmentName?: string;
  position?: string;
  corporateId?: string;
  corporateCode?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};
export type UpdateEmployeeStatusDto = z.infer<typeof UpdateEmployeeStatusBodySchema>;

export interface EmployeeRecord {
  id: string;
  corporateId: string;
  employeeCode: string;
  email: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  gender: z.infer<typeof EmployeeGenderSchema> | null;
  position: string | null;
  departmentName: string | null;
  costCenterName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  corporateName: string | null;
  corporateCode: string | null;
  access: z.infer<typeof EmployeeAccessSchema>[];
  status: z.infer<typeof EmployeeStatusSchema>;
  grade: string | null;
  managerName: string | null;
  managerEmployeeId: string | null;
  isApprover: boolean;
  needsApprover: boolean;
  l1ApproverId: string | null;
  l2ApproverId: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResponse {
  items: EmployeeRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const EmployeeRecordSchema = z.object({
  id: z.string(),
  corporateId: z.string(),
  employeeCode: z.string(),
  email: z.string(),
  title: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  gender: EmployeeGenderSchema.nullable(),
  position: z.string().nullable(),
  departmentName: z.string().nullable(),
  costCenterName: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  pinCode: z.string().nullable(),
  corporateName: z.string().nullable(),
  corporateCode: z.string().nullable(),
  access: z.array(EmployeeAccessSchema),
  status: EmployeeStatusSchema,
  grade: z.string().nullable(),
  managerName: z.string().nullable(),
  managerEmployeeId: z.string().nullable(),
  isApprover: z.boolean(),
  needsApprover: z.boolean(),
  l1ApproverId: z.string().nullable(),
  l2ApproverId: z.string().nullable(),
  joinedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const EmployeeListResponseSchema = z.object({
  items: z.array(EmployeeRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const EmployeeUniqueCheckSchema = z.object({
  employeeCode: z.string(),
  available: z.boolean(),
});

export const EmployeeDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});

export const EmployeeNextCodeSchema = z.object({
  employeeCode: z.string(),
});
