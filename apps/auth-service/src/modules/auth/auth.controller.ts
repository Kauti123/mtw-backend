import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from './auth.service';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(10),
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: unknown) {
    const dto = LoginSchema.parse(body);
    return this.auth.login(dto.email, dto.password);
  }

  @Post('refresh')
  refresh(@Body() body: unknown) {
    const dto = RefreshSchema.parse(body);
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('register')
  register(@Body() body: unknown) {
    const dto = LoginSchema.extend({
      displayName: z.string().min(1),
      corporateId: z.string().optional(),
    }).parse(body);
    return this.auth.register(dto);
  }
}
