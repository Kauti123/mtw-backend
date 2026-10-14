import { z } from 'zod';

export const TboSearchResponseSchema = z
  .object({
    offers: z.array(z.unknown()).optional(),
  })
  .passthrough();
