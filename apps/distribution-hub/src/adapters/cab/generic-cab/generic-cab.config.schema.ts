import { z } from 'zod';

export const GenericCabConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type GenericCabConfig = z.infer<typeof GenericCabConfigSchema>;
