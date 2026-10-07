import { z } from 'zod';

export const GtaConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type GtaConfig = z.infer<typeof GtaConfigSchema>;
