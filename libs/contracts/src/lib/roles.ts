import { z } from 'zod';

const ROLE_CODE_PATTERN = /^[A-Z0-9_]+$/;

const RoleTypeSchema = z.enum(['INTERNAL', 'EXTERNAL', 'PARTNER']);
const DataScopeSchema = z.enum(['GLOBAL', 'CORPORATE', 'BRANCH', 'SELF']);
const RoleStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

const ROLE_TYPE_ALIASES: Record<string, z.infer<typeof RoleTypeSchema>> = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  PARTNER: 'PARTNER',
  Internal: 'INTERNAL',
  External: 'EXTERNAL',
  Partner: 'PARTNER',
};

const DATA_SCOPE_ALIASES: Record<string, z.infer<typeof DataScopeSchema>> = {
  GLOBAL: 'GLOBAL',
  CORPORATE: 'CORPORATE',
  BRANCH: 'BRANCH',
  SELF: 'SELF',
  Global: 'GLOBAL',
  Corporate: 'CORPORATE',
  Branch: 'BRANCH',
  Self: 'SELF',
};

const ROLE_STATUS_ALIASES: Record<string, z.infer<typeof RoleStatusSchema>> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
};

function normalizeRoleType(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return ROLE_TYPE_ALIASES[value] ?? value.toUpperCase();
}

function normalizeDataScope(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return DATA_SCOPE_ALIASES[value] ?? value.toUpperCase();
}

function normalizeRoleStatus(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return ROLE_STATUS_ALIASES[value] ?? value.toUpperCase();
}

function normalizeMakerChecker(value: unknown): unknown {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true' || normalized === '1') return true;
  if (normalized === 'no' || normalized === 'false' || normalized === '0') return false;
  return value;
}

function preprocessRolePayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['roleName'] && !copy['name']) copy['name'] = copy['roleName'];
  if (copy['roleCode'] && !copy['code']) copy['code'] = copy['roleCode'];
  if (copy['scope'] && !copy['dataScope']) copy['dataScope'] = copy['scope'];
  if (copy['maker'] !== undefined && copy['makerCheckerRequired'] === undefined) {
    copy['makerCheckerRequired'] = copy['maker'];
  }

  if (typeof copy['code'] === 'string') {
    copy['code'] = copy['code'].trim().toUpperCase();
  }
  if (typeof copy['name'] === 'string') {
    copy['name'] = copy['name'].trim();
  }
  if (typeof copy['description'] === 'string') {
    copy['description'] = copy['description'].trim();
  }

  if (copy['roleType'] !== undefined) copy['roleType'] = normalizeRoleType(copy['roleType']);
  if (copy['dataScope'] !== undefined) copy['dataScope'] = normalizeDataScope(copy['dataScope']);
  if (copy['status'] !== undefined) copy['status'] = normalizeRoleStatus(copy['status']);
  if (copy['makerCheckerRequired'] !== undefined) {
    copy['makerCheckerRequired'] = normalizeMakerChecker(copy['makerCheckerRequired']);
  }

  return copy;
}

export const RoleGrantActionsSchema = z.object({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

export const RolePermissionSchema = z.object({
  permissionId: z.string().optional(),
  permissionCode: z.string().min(1).max(64),
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

export const RoleGrantsSchema = z.record(z.string(), RoleGrantActionsSchema);

export const BaseRoleSchema = z.object({
  name: z.string().min(1).max(128),
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(ROLE_CODE_PATTERN, 'Use uppercase letters, numbers and underscore'),
  description: z.string().max(250).optional().default(''),
  roleType: RoleTypeSchema,
  dataScope: DataScopeSchema,
  status: RoleStatusSchema.default('ACTIVE'),
  makerCheckerRequired: z.boolean().default(false),
  corporateId: z.string().max(64).optional().nullable(),
  permissions: z.array(RolePermissionSchema).optional().default([]),
  grants: RoleGrantsSchema.optional(),
});

export const CreateRoleSchema = z.preprocess(preprocessRolePayload, BaseRoleSchema);

export const UpdateRoleSchema = z.preprocess(preprocessRolePayload, BaseRoleSchema.partial());

export const RoleQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (copy['status'] !== undefined) copy['status'] = normalizeRoleStatus(copy['status']);
    if (copy['roleType'] !== undefined) copy['roleType'] = normalizeRoleType(copy['roleType']);
    if (copy['dataScope'] !== undefined) copy['dataScope'] = normalizeDataScope(copy['dataScope']);
    return copy;
  },
  z.object({
    search: z.string().optional(),
    status: RoleStatusSchema.optional(),
    roleType: RoleTypeSchema.optional(),
    dataScope: DataScopeSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const UpdateRoleStatusBodySchema = z.object({
  status: RoleStatusSchema,
  reason: z.string().optional(),
});

export const UpdateRoleStatusSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };
  if (copy['status'] !== undefined) copy['status'] = normalizeRoleStatus(copy['status']);
  return copy;
}, UpdateRoleStatusBodySchema);

export type RoleGrantActions = z.infer<typeof RoleGrantActionsSchema>;
export type RolePermissionDto = z.infer<typeof RolePermissionSchema>;
export type CreateRoleDto = z.output<typeof BaseRoleSchema>;
export type UpdateRoleDto = Partial<CreateRoleDto>;
export type RoleQueryDto = {
  search?: string;
  status?: z.infer<typeof RoleStatusSchema>;
  roleType?: z.infer<typeof RoleTypeSchema>;
  dataScope?: z.infer<typeof DataScopeSchema>;
  page: number;
  limit: number;
};
export type UpdateRoleStatusDto = z.infer<typeof UpdateRoleStatusBodySchema>;

export interface RoleRecord {
  id: string;
  name: string;
  code: string;
  description: string;
  roleType: z.infer<typeof RoleTypeSchema>;
  dataScope: z.infer<typeof DataScopeSchema>;
  status: z.infer<typeof RoleStatusSchema>;
  makerCheckerRequired: boolean;
  corporateId: string | null;
  permissions: RolePermissionDto[];
  grants: Record<string, RoleGrantActions>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleListResponse {
  items: RoleRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const RoleRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string(),
  roleType: RoleTypeSchema,
  dataScope: DataScopeSchema,
  status: RoleStatusSchema,
  makerCheckerRequired: z.boolean(),
  corporateId: z.string().nullable(),
  permissions: z.array(RolePermissionSchema),
  grants: RoleGrantsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RoleListResponseSchema = z.object({
  items: z.array(RoleRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const RoleCodeAvailabilitySchema = z.object({
  code: z.string(),
  available: z.boolean(),
});

export const RoleDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});

/** Convert UI grant map into role permission grant rows. */
export function grantsToPermissions(
  grants: z.infer<typeof RoleGrantsSchema> | undefined,
): RolePermissionDto[] {
  if (!grants) return [];
  return Object.entries(grants)
    .filter(([, actions]) =>
      Boolean(actions.view || actions.create || actions.edit || actions.delete),
    )
    .map(([permissionCode, actions]) => ({
      permissionCode,
      view: actions.view,
      create: actions.create,
      edit: actions.edit,
      delete: actions.delete,
    }));
}

/** Convert role permission rows into UI grant map. */
export function permissionsToGrants(
  permissions: RolePermissionDto[] | undefined,
): Record<string, RoleGrantActions> {
  const grants: Record<string, RoleGrantActions> = {};
  for (const permission of permissions ?? []) {
    grants[permission.permissionCode] = {
      view: permission.view,
      create: permission.create,
      edit: permission.edit,
      delete: permission.delete,
    };
  }
  return grants;
}

export function normalizeRolePermissionInput(input: {
  permissions?: RolePermissionDto[];
  grants?: z.infer<typeof RoleGrantsSchema>;
}): RolePermissionDto[] {
  if (input.grants && Object.keys(input.grants).length > 0) {
    return grantsToPermissions(input.grants);
  }
  return input.permissions ?? [];
}
