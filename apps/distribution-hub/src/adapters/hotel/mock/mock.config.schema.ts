import { z } from 'zod';

export const MockConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url(),
});
export type MockConfig = z.infer<typeof MockConfigSchema>;
