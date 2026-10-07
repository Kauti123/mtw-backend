import { z } from 'zod';

export const GenericTrainSearchResponseSchema = z
  .object({
    offers: z.array(z.unknown()).optional(),
  })
  .passthrough();
