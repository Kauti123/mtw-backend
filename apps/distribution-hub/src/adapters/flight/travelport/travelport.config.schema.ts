import { z } from 'zod';

export const TravelportConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type TravelportConfig = z.infer<typeof TravelportConfigSchema>;
