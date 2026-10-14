import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '@mtw/common';
import { AuthService } from './auth.service';
import {
  AuthTokenResponseOpenApi,
  LoginExample,
  LoginOpenApi,
  LoginSchema,
  RefreshExample,
  RefreshOpenApi,
  RefreshSchema,
  RegisterExample,
  RegisterOpenApi,
  RegisterSchema,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiBody({
    schema: LoginOpenApi,
    examples: { default: { summary: 'Login', value: LoginExample } },
  })
  @ApiOkResponse({ schema: AuthTokenResponseOpenApi, description: 'Access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() body: unknown) {
    const dto = LoginSchema.parse(body);
    return this.auth.login(dto.email, dto.password);
  }

  @Public()
  @Post('corporate/login')
  @ApiOperation({
    summary: 'Corporate portal sign-in',
    description:
      'Authenticate with the official email and password set when the corporate account was created in Supervision.',
  })
  @ApiBody({
    schema: LoginOpenApi,
    examples: { default: { summary: 'Corporate login', value: LoginExample } },
  })
  @ApiOkResponse({ schema: AuthTokenResponseOpenApi, description: 'Access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  corporateLogin(@Body() body: unknown) {
    const dto = LoginSchema.parse(body);
    return this.auth.corporateLogin(dto.email, dto.password);
  }

  @Public()
  @Post('corporate/refresh')
  @ApiOperation({ summary: 'Refresh corporate portal access token' })
  @ApiBody({
    schema: RefreshOpenApi,
    examples: { default: { summary: 'Refresh token', value: RefreshExample } },
  })
  @ApiOkResponse({ schema: AuthTokenResponseOpenApi, description: 'Rotated access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  corporateRefresh(@Body() body: unknown) {
    const dto = RefreshSchema.parse(body);
    return this.auth.corporateRefresh(dto.refreshToken);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiBody({
    schema: RefreshOpenApi,
    examples: { default: { summary: 'Refresh token', value: RefreshExample } },
  })
  @ApiOkResponse({ schema: AuthTokenResponseOpenApi, description: 'Rotated access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  refresh(@Body() body: unknown) {
    const dto = RefreshSchema.parse(body);
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user and issue tokens' })
  @ApiBody({
    schema: RegisterOpenApi,
    examples: { default: { summary: 'Register', value: RegisterExample } },
  })
  @ApiCreatedResponse({ schema: AuthTokenResponseOpenApi, description: 'Registered user with tokens' })
  @ApiUnauthorizedResponse({ description: 'Email already registered' })
  register(@Body() body: unknown) {
    const dto = RegisterSchema.parse(body);
    return this.auth.register(dto);
  }
}
