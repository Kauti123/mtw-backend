import { z } from 'zod';

export const TravelportSearchResponseSchema = z
  .object({
    offers: z.array(z.unknown()).optional(),
  })
  .passthrough();
