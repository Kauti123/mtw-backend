import { z } from 'zod';

export const AmadeusSearchResponseSchema = z
  .object({
    offers: z.array(z.unknown()).optional(),
  })
  .passthrough();
