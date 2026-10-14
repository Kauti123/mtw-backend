import { z } from 'zod';

export const CityQuerySchema = z.object({
  search: z.string().optional(),
  countryCode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type CityQueryDto = z.output<typeof CityQuerySchema>;

export type CityRecord = {
  id: string;
  countryId: string;
  countryCode: string;
  code: string;
  name: string;
  label: string;
};

export type CityListResponse = {
  items: CityRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
