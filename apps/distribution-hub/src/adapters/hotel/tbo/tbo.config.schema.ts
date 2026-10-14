import { z } from 'zod';

export const TboConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type TboConfig = z.infer<typeof TboConfigSchema>;
