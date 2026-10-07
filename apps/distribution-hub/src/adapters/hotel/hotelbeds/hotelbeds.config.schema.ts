import { z } from 'zod';

export const HotelbedsConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type HotelbedsConfig = z.infer<typeof HotelbedsConfigSchema>;
