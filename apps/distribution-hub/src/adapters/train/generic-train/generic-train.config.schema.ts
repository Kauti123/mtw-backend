import { z } from 'zod';

export const GenericTrainConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type GenericTrainConfig = z.infer<typeof GenericTrainConfigSchema>;
