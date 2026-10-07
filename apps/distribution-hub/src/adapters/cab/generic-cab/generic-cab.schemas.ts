import { z } from 'zod';

export const GenericCabSearchResponseSchema = z
  .object({
    offers: z.array(z.unknown()).optional(),
  })
  .passthrough();
