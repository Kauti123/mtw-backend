import { zodToOpenAPI } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const RegisterSchema = LoginSchema.extend({
  displayName: z.string().min(1),
  corporateId: z.string().optional(),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  displayName: z.string().optional(),
  role: z.string().optional(),
  roleCode: z.string().optional(),
  corporateId: z.string().nullable().optional(),
  corporateName: z.string().optional(),
  corporateCode: z.string().optional(),
  currency: z.string().optional(),
});

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int(),
  user: AuthUserSchema,
});

export const LoginOpenApi = zodToOpenAPI(LoginSchema as never);
export const RefreshOpenApi = zodToOpenAPI(RefreshSchema as never);
export const RegisterOpenApi = zodToOpenAPI(RegisterSchema as never);
export const AuthTokenResponseOpenApi = zodToOpenAPI(AuthTokenResponseSchema as never);

export const LoginExample = {
  email: 'john.mathew@acmecorp.com',
  password: 'Password123',
};

export const RefreshExample = {
  refreshToken: 'replace-with-refresh-token',
};

export const RegisterExample = {
  email: 'john.mathew@acmecorp.com',
  password: 'Password123',
  displayName: 'John Mathew',
  corporateId: 'ACME001',
};
