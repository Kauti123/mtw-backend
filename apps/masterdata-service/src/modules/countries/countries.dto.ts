import { z } from 'zod';

export const CountryQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const StateQuerySchema = z.object({
  search: z.string().optional(),
  countryId: z.string().optional(),
  countryCode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type CountryQueryDto = z.infer<typeof CountryQuerySchema>;
export type StateQueryDto = z.infer<typeof StateQuerySchema>;

export type CountryRecord = {
  id: string;
  code: string;
  name: string;
  label: string;
};

export type StateRecord = {
  id: string;
  countryId: string;
  countryCode: string;
  code: string;
  name: string;
  label: string;
};

export type CountryListResponse = {
  items: CountryRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type StateListResponse = {
  items: StateRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
