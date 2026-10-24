import { z } from 'zod';

const PERMISSION_CODE_PATTERN = /^[a-z0-9]+(\.[a-z0-9_]+)+$/;
const MODULE_CODE_PATTERN = /^[a-z0-9_]+$/;

const EntityStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

function normalizeStatus(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const upper = value.trim().toUpperCase();
  if (upper === 'ACTIVE' || upper === 'INACTIVE') return upper;
  if (value.trim().toLowerCase() === 'active') return 'ACTIVE';
  if (value.trim().toLowerCase() === 'inactive') return 'INACTIVE';
  return value;
}

function preprocessPermissionPayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['permissionName'] && !copy['name']) copy['name'] = copy['permissionName'];
  if (copy['permissionCode'] && !copy['code']) copy['code'] = copy['permissionCode'];
  if (copy['module'] && !copy['moduleCode']) copy['moduleCode'] = copy['module'];

  if (typeof copy['code'] === 'string') copy['code'] = copy['code'].trim().toLowerCase();
  if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
  if (typeof copy['moduleCode'] === 'string') {
    copy['moduleCode'] = copy['moduleCode'].trim().toLowerCase();
  }
  if (typeof copy['description'] === 'string') {
    copy['description'] = copy['description'].trim();
  }
  if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);

  return copy;
}

function preprocessModulePayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };
  if (typeof copy['code'] === 'string') copy['code'] = copy['code'].trim().toLowerCase();
  if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
  if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
  return copy;
}

export const PermissionActionsSchema = z.object({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

export const BasePermissionModuleSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(MODULE_CODE_PATTERN, 'Use lowercase letters, numbers and underscore'),
  name: z.string().min(1).max(128),
  sortOrder: z.number().int().min(0).optional().default(0),
  tone: z.string().max(64).optional().nullable(),
  status: EntityStatusSchema.default('ACTIVE'),
});

export const CreatePermissionModuleSchema = z.preprocess(
  preprocessModulePayload,
  BasePermissionModuleSchema,
);

export const UpdatePermissionModuleSchema = z.preprocess(
  preprocessModulePayload,
  BasePermissionModuleSchema.partial(),
);

export const PermissionBodySchema = z.object({
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(PERMISSION_CODE_PATTERN, 'Use module.action format (e.g. bookings.view)'),
  name: z.string().min(1).max(128),
  moduleId: z.string().optional(),
  moduleCode: z.string().min(1).max(64).optional(),
  description: z.string().max(250).optional().nullable().default(null),
  sortOrder: z.number().int().min(0).optional().default(0),
  status: EntityStatusSchema.default('ACTIVE'),
});

export const BasePermissionSchema = PermissionBodySchema.refine(
  (value) => Boolean(value.moduleId || value.moduleCode),
  {
    message: 'moduleId or moduleCode is required',
    path: ['moduleCode'],
  },
);

export const CreatePermissionSchema = z.preprocess(
  preprocessPermissionPayload,
  BasePermissionSchema,
);

export const UpdatePermissionSchema = z.preprocess(
  preprocessPermissionPayload,
  z
    .object({
      code: z.string().min(1).max(64).regex(PERMISSION_CODE_PATTERN).optional(),
      name: z.string().min(1).max(128).optional(),
      moduleId: z.string().optional(),
      moduleCode: z.string().min(1).max(64).optional(),
      description: z.string().max(250).optional().nullable(),
      sortOrder: z.number().int().min(0).optional(),
      status: EntityStatusSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required for update',
    }),
);

export const PermissionQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (copy['status'] !== undefined) copy['status'] = normalizeStatus(copy['status']);
    if (typeof copy['moduleCode'] === 'string') {
      copy['moduleCode'] = copy['moduleCode'].trim().toLowerCase();
    }
    return copy;
  },
  z.object({
    search: z.string().optional(),
    status: EntityStatusSchema.optional(),
    moduleId: z.string().optional(),
    moduleCode: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
);

export type PermissionActions = z.infer<typeof PermissionActionsSchema>;
export type CreatePermissionModuleDto = z.output<typeof BasePermissionModuleSchema>;
export type UpdatePermissionModuleDto = Partial<CreatePermissionModuleDto>;
export type CreatePermissionDto = z.output<typeof PermissionBodySchema>;
export type UpdatePermissionDto = {
  code?: string;
  name?: string;
  moduleId?: string;
  moduleCode?: string;
  description?: string | null;
  sortOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
};
export type PermissionQueryDto = {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  moduleId?: string;
  moduleCode?: string;
  page: number;
  limit: number;
};

export interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  description: string | null;
  sortOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface PermissionModuleRecord {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  tone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  permissions: PermissionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionListResponse {
  items: PermissionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PermissionMatrixResponse {
  modules: PermissionModuleRecord[];
}

export const PermissionRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  moduleId: z.string(),
  moduleCode: z.string(),
  moduleName: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  status: EntityStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PermissionModuleRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
  tone: z.string().nullable(),
  status: EntityStatusSchema,
  permissions: z.array(PermissionRecordSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PermissionListResponseSchema = z.object({
  items: z.array(PermissionRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const PermissionMatrixResponseSchema = z.object({
  modules: z.array(PermissionModuleRecordSchema),
});

export const PermissionDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});

export const PermissionCodeAvailabilitySchema = z.object({
  code: z.string(),
  available: z.boolean(),
});

/** Default seeded catalog matching the Access Control permission matrix UI. */
export const DEFAULT_PERMISSION_CATALOG: Array<{
  code: string;
  name: string;
  tone: string;
  sortOrder: number;
  permissions: Array<{ code: string; name: string; sortOrder: number }>;
}> = [
  {
    code: 'dashboard',
    name: 'Dashboard',
    tone: 'rose',
    sortOrder: 10,
    permissions: [
      { code: 'dashboard.view', name: 'View Dashboard', sortOrder: 10 },
      { code: 'dashboard.reports', name: 'View Reports', sortOrder: 20 },
    ],
  },
  {
    code: 'bookings',
    name: 'Bookings',
    tone: 'emerald',
    sortOrder: 20,
    permissions: [
      { code: 'bookings.view', name: 'View Bookings', sortOrder: 10 },
      { code: 'bookings.create', name: 'Create Bookings', sortOrder: 20 },
      { code: 'bookings.edit', name: 'Edit Bookings', sortOrder: 30 },
      { code: 'bookings.cancel', name: 'Cancel Bookings', sortOrder: 40 },
    ],
  },
  {
    code: 'flight',
    name: 'Flight',
    tone: 'sky',
    sortOrder: 30,
    permissions: [
      { code: 'flight.view', name: 'View Flights', sortOrder: 10 },
      { code: 'flight.create', name: 'Create Flight Booking', sortOrder: 20 },
      { code: 'flight.edit', name: 'Edit Flight Booking', sortOrder: 30 },
      { code: 'flight.cancel', name: 'Cancel Flight Booking', sortOrder: 40 },
    ],
  },
  {
    code: 'hotel',
    name: 'Hotel',
    tone: 'orange',
    sortOrder: 40,
    permissions: [
      { code: 'hotel.view', name: 'View Hotels', sortOrder: 10 },
      { code: 'hotel.create', name: 'Create Hotel Booking', sortOrder: 20 },
      { code: 'hotel.edit', name: 'Edit Hotel Booking', sortOrder: 30 },
      { code: 'hotel.cancel', name: 'Cancel Hotel Booking', sortOrder: 40 },
    ],
  },
  {
    code: 'corporate',
    name: 'Corporate',
    tone: 'pink',
    sortOrder: 50,
    permissions: [
      { code: 'corporate.view', name: 'View Corporates', sortOrder: 10 },
      { code: 'corporate.create', name: 'Create Corporate', sortOrder: 20 },
      { code: 'corporate.edit', name: 'Edit Corporate', sortOrder: 30 },
      { code: 'corporate.delete', name: 'Delete Corporate', sortOrder: 40 },
    ],
  },
  {
    code: 'suppliers',
    name: 'Suppliers',
    tone: 'violet',
    sortOrder: 60,
    permissions: [
      { code: 'suppliers.view', name: 'View Suppliers', sortOrder: 10 },
      { code: 'suppliers.create', name: 'Create Supplier', sortOrder: 20 },
      { code: 'suppliers.edit', name: 'Edit Supplier', sortOrder: 30 },
      { code: 'suppliers.delete', name: 'Delete Supplier', sortOrder: 40 },
    ],
  },
  {
    code: 'finance',
    name: 'Finance',
    tone: 'amber',
    sortOrder: 70,
    permissions: [
      { code: 'finance.view', name: 'View Finance', sortOrder: 10 },
      { code: 'finance.create', name: 'Create Entry', sortOrder: 20 },
      { code: 'finance.edit', name: 'Edit Entry', sortOrder: 30 },
      { code: 'finance.delete', name: 'Delete Entry', sortOrder: 40 },
    ],
  },
  {
    code: 'reports',
    name: 'Reports',
    tone: 'teal',
    sortOrder: 80,
    permissions: [
      { code: 'reports.view', name: 'View Reports', sortOrder: 10 },
      { code: 'reports.create', name: 'Create Report', sortOrder: 20 },
      { code: 'reports.edit', name: 'Edit Report', sortOrder: 30 },
      { code: 'reports.delete', name: 'Delete Report', sortOrder: 40 },
    ],
  },
  {
    code: 'users',
    name: 'Users & Roles',
    tone: 'rose',
    sortOrder: 90,
    permissions: [
      { code: 'users.view', name: 'View Users', sortOrder: 10 },
      { code: 'users.create', name: 'Create User', sortOrder: 20 },
      { code: 'users.edit', name: 'Edit User', sortOrder: 30 },
      { code: 'users.delete', name: 'Delete User', sortOrder: 40 },
    ],
  },
  {
    code: 'settings',
    name: 'Settings',
    tone: 'slate',
    sortOrder: 100,
    permissions: [
      { code: 'settings.view', name: 'View Settings', sortOrder: 10 },
      { code: 'settings.create', name: 'Create Setting', sortOrder: 20 },
      { code: 'settings.edit', name: 'Edit Setting', sortOrder: 30 },
      { code: 'settings.delete', name: 'Delete Setting', sortOrder: 40 },
    ],
  },
];
