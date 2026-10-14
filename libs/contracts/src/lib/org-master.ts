import { z } from 'zod';

export const OrgMasterKindSchema = z.enum([
  'department',
  'position',
  'cost-center',
]);
export type OrgMasterKind = z.infer<typeof OrgMasterKindSchema>;

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function preprocessOrgMasterPayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['departmentName'] && !copy['name']) copy['name'] = copy['departmentName'];
  if (copy['positionName'] && !copy['name']) copy['name'] = copy['positionName'];
  if (copy['costCenterName'] && !copy['name']) copy['name'] = copy['costCenterName'];

  if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
  if (typeof copy['code'] === 'string') {
    copy['code'] = copy['code'].trim().toUpperCase().replace(/\s+/g, '_');
  }
  if (typeof copy['hierarchy'] === 'string') {
    copy['hierarchy'] = copy['hierarchy'].trim();
  }
  if (typeof copy['corporateCode'] === 'string') {
    copy['corporateCode'] = copy['corporateCode'].trim().toUpperCase();
  }
  if (copy['corporateId'] !== undefined) copy['corporateId'] = emptyToUndefined(copy['corporateId']);
  if (copy['code'] !== undefined) copy['code'] = emptyToUndefined(copy['code']);
  if (copy['hierarchy'] !== undefined) copy['hierarchy'] = emptyToUndefined(copy['hierarchy']);

  return copy;
}

export const BaseOrgMasterSchema = z.object({
  name: z.string().trim().min(1).max(128),
  code: z.string().trim().min(1).max(64).optional(),
  hierarchy: z.string().trim().min(1).max(64).optional(),
  corporateId: z.string().trim().min(1).optional(),
  corporateCode: z.string().trim().min(1).max(64).optional(),
});

export const CreateOrgMasterSchema = z.preprocess(
  preprocessOrgMasterPayload,
  BaseOrgMasterSchema,
);

export const UpdateOrgMasterSchema = z.preprocess(
  preprocessOrgMasterPayload,
  BaseOrgMasterSchema.partial(),
);

export const OrgMasterQuerySchema = z.object({
  search: z.string().trim().optional(),
  corporateId: z.string().trim().optional(),
  corporateCode: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const OrgMasterRecordSchema = z.object({
  id: z.string(),
  kind: OrgMasterKindSchema,
  corporateId: z.string(),
  name: z.string(),
  code: z.string(),
  hierarchy: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OrgMasterListResponseSchema = z.object({
  items: z.array(OrgMasterRecordSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const OrgMasterDeleteResponseSchema = z.object({
  id: z.string(),
  deleted: z.boolean(),
});

export type CreateOrgMasterDto = z.infer<typeof BaseOrgMasterSchema>;
export type UpdateOrgMasterDto = Partial<CreateOrgMasterDto>;
export type OrgMasterQueryDto = z.infer<typeof OrgMasterQuerySchema>;
export type OrgMasterRecord = z.infer<typeof OrgMasterRecordSchema>;
export type OrgMasterListResponse = z.infer<typeof OrgMasterListResponseSchema>;

export const CreateDepartmentExample = {
  name: 'Engineering',
  corporateId: 'corp_acme_01',
};

export const CreatePositionExample = {
  name: 'Software Engineer',
  hierarchy: '3',
  corporateId: 'corp_acme_01',
};

export const CreateCostCenterExample = {
  name: 'CC-1002 · Engineering',
  corporateId: 'corp_acme_01',
};
