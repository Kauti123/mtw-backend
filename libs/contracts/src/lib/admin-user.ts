import { z } from 'zod';

export const AdminRoleCodeSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'SUPPORT',
  'FINANCE',
  'OPERATIONS',
]);

export const AdminUserStatusSchema = z.enum([
  'ACTIVE',
  'INVITED',
  'SUSPENDED',
  'DELETED',
]);

const ROLE_ALIASES: Record<string, z.infer<typeof AdminRoleCodeSchema>> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  FINANCE: 'FINANCE',
  OPERATIONS: 'OPERATIONS',
  'Super Admin': 'SUPER_ADMIN',
  Admin: 'ADMIN',
  Support: 'SUPPORT',
  Finance: 'FINANCE',
  Operations: 'OPERATIONS',
};

const ROLE_NAMES: Record<z.infer<typeof AdminRoleCodeSchema>, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SUPPORT: 'Support',
  FINANCE: 'Finance',
  OPERATIONS: 'Operations',
};

const STATUS_ALIASES: Record<string, z.infer<typeof AdminUserStatusSchema>> = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
  Active: 'ACTIVE',
  Inactive: 'SUSPENDED',
  Invited: 'INVITED',
  Suspended: 'SUSPENDED',
};

function preprocessAdminPayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (typeof copy['email'] === 'string') copy['email'] = copy['email'].trim().toLowerCase();
  if (typeof copy['firstName'] === 'string') copy['firstName'] = copy['firstName'].trim();
  if (typeof copy['lastName'] === 'string') copy['lastName'] = copy['lastName'].trim();
  if (typeof copy['phone'] === 'string') {
    const phone = copy['phone'].trim();
    copy['phone'] = phone.length === 0 ? null : phone;
  }
  if (typeof copy['address'] === 'string') {
    const address = copy['address'].trim();
    copy['address'] = address.length === 0 ? null : address;
  }
  if (typeof copy['role'] === 'string' && !copy['roleCode']) {
    copy['roleCode'] = copy['role'];
  }
  if (typeof copy['roleCode'] === 'string') {
    copy['roleCode'] =
      ROLE_ALIASES[copy['roleCode']] ??
      ROLE_ALIASES[copy['roleCode'].toUpperCase()] ??
      copy['roleCode'];
  }
  if (typeof copy['status'] === 'string') {
    copy['status'] =
      STATUS_ALIASES[copy['status']] ??
      STATUS_ALIASES[copy['status'].toUpperCase()] ??
      copy['status'];
  }
  if (!copy['displayName'] && copy['firstName'] && copy['lastName']) {
    copy['displayName'] = `${copy['firstName']} ${copy['lastName']}`.trim();
  }
  if (
    typeof copy['roleCode'] === 'string' &&
    !copy['roleName'] &&
    ROLE_NAMES[copy['roleCode'] as z.infer<typeof AdminRoleCodeSchema>]
  ) {
    copy['roleName'] =
      ROLE_NAMES[copy['roleCode'] as z.infer<typeof AdminRoleCodeSchema>];
  }
  return copy;
}

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const AdminRefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const BaseAdminUserSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128).optional(),
  firstName: z.string().min(1).max(128),
  lastName: z.string().min(1).max(128),
  displayName: z.string().min(1).max(255).optional(),
  phone: z.string().max(32).optional().nullable().default(null),
  address: z.string().max(512).optional().nullable().default(null),
  roleCode: AdminRoleCodeSchema.default('ADMIN'),
  roleName: z.string().min(1).max(128).optional(),
  status: AdminUserStatusSchema.default('ACTIVE'),
  mfaEnabled: z.boolean().default(false),
  mustChangePassword: z.boolean().default(false),
  isEmailVerified: z.boolean().default(true),
  createdBy: z.string().max(64).optional().nullable().default(null),
});

export const CreateAdminUserSchema = z.preprocess(
  preprocessAdminPayload,
  BaseAdminUserSchema.refine((value) => Boolean(value.password), {
    message: 'Password is required when creating an admin user',
    path: ['password'],
  }),
);

export const CreateAdminUserBodySchema = BaseAdminUserSchema.extend({
  password: z.string().min(8).max(128),
});

export const UpdateAdminUserSchema = z.preprocess(
  preprocessAdminPayload,
  BaseAdminUserSchema.partial().extend({
    password: z.string().min(8).max(128).optional(),
  }),
);

export const UpdateAdminUserBodySchema = BaseAdminUserSchema.partial().extend({
  password: z.string().min(8).max(128).optional(),
});

export const AdminUserQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    return preprocessAdminPayload(input);
  },
  z.object({
    search: z.string().optional(),
    status: AdminUserStatusSchema.optional(),
    roleCode: AdminRoleCodeSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const UpdateAdminUserStatusBodySchema = z.object({
  status: AdminUserStatusSchema,
  reason: z.string().optional(),
});

export const UpdateAdminUserStatusSchema = z.preprocess((input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  return preprocessAdminPayload(input);
}, UpdateAdminUserStatusBodySchema);

export const ChangeAdminPasswordSchema = z.object({
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(8).max(128),
});

export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;
export type CreateAdminUserDto = z.output<typeof CreateAdminUserBodySchema>;
export type UpdateAdminUserDto = z.output<typeof UpdateAdminUserBodySchema>;
export type AdminUserQueryDto = {
  search?: string;
  status?: z.infer<typeof AdminUserStatusSchema>;
  roleCode?: z.infer<typeof AdminRoleCodeSchema>;
  page: number;
  limit: number;
};
export type UpdateAdminUserStatusDto = z.infer<typeof UpdateAdminUserStatusBodySchema>;
export type ChangeAdminPasswordDto = z.infer<typeof ChangeAdminPasswordSchema>;

export interface AdminUserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string | null;
  address: string | null;
  roleCode: z.infer<typeof AdminRoleCodeSchema>;
  roleName: string;
  status: z.infer<typeof AdminUserStatusSchema>;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  isEmailVerified: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  items: AdminUserRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleCode: string;
  mustChangePassword: boolean;
}

export interface AdminAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AdminAuthUser;
}

export const AdminUserRecordSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  roleCode: AdminRoleCodeSchema,
  roleName: z.string(),
  status: AdminUserStatusSchema,
  mfaEnabled: z.boolean(),
  lastLoginAt: z.string().nullable(),
  failedLoginAttempts: z.number().int(),
  lockedUntil: z.string().nullable(),
  mustChangePassword: z.boolean(),
  isEmailVerified: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AdminUserListResponseSchema = z.object({
  items: z.array(AdminUserRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const AdminAuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.string(),
  roleCode: z.string(),
  mustChangePassword: z.boolean(),
});

export const AdminAuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int(),
  user: AdminAuthUserSchema,
});

export const AdminUserDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});

export const AdminEmailAvailabilitySchema = z.object({
  email: z.string().email(),
  available: z.boolean(),
});

export function resolveAdminRoleName(
  roleCode: z.infer<typeof AdminRoleCodeSchema>,
  roleName?: string | null,
): string {
  return roleName?.trim() || ROLE_NAMES[roleCode];
}
