import { z } from 'zod';

export const GenericBusConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type GenericBusConfig = z.infer<typeof GenericBusConfigSchema>;
