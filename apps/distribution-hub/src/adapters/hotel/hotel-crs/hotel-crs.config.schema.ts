import { z } from 'zod';

export const HotelCrsConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type HotelCrsConfig = z.infer<typeof HotelCrsConfigSchema>;
