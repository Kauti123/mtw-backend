import { z } from 'zod';

export const CorporateGeographyQuerySchema = z.object({
  corporateId: z.string().min(1),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const CreateCorporateGeographySchema = z.object({
  corporateId: z.string().min(1),
  countryId: z.string().min(1),
  stateId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export const UpdateCorporateGeographySchema = z.object({
  stateId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CorporateGeographyQueryDto = z.infer<typeof CorporateGeographyQuerySchema>;
export type CreateCorporateGeographyDto = z.infer<typeof CreateCorporateGeographySchema>;
export type UpdateCorporateGeographyDto = z.infer<typeof UpdateCorporateGeographySchema>;

export type CorporateGeographyRecord = {
  id: string;
  corporateId: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  stateId: string | null;
  stateCode: string | null;
  stateName: string | null;
  cityId: string | null;
  cityCode: string | null;
  cityName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
};

export type CorporateGeographyListResponse = {
  items: CorporateGeographyRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
