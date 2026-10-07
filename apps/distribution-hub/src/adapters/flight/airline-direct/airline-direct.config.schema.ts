import { z } from 'zod';

export const AirlineDirectConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type AirlineDirectConfig = z.infer<typeof AirlineDirectConfigSchema>;
