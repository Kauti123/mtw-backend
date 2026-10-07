import { z } from 'zod';

export const AmadeusConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type AmadeusConfig = z.infer<typeof AmadeusConfigSchema>;
