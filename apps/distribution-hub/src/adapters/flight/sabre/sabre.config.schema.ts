import { z } from 'zod';

export const SabreConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type SabreConfig = z.infer<typeof SabreConfigSchema>;
