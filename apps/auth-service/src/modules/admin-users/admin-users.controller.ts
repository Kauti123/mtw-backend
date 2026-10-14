import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '@mtw/common';
import {
  AdminEmailAvailabilityOpenApi,
  AdminLoginExample,
  AdminLoginOpenApi,
  AdminAuthTokenResponseOpenApi,
  AdminRefreshOpenApi,
  AdminUserDeleteResponseOpenApi,
  AdminUserListResponseOpenApi,
  AdminUserRecordOpenApi,
  ChangeAdminPasswordOpenApi,
  CreateAdminUserExample,
  CreateAdminUserOpenApi,
  UpdateAdminUserOpenApi,
  UpdateAdminUserStatusOpenApi,
} from '@mtw/contracts';
import { AdminUsersService } from './admin-users.service';
import {
  AdminLoginSchema,
  AdminRefreshSchema,
  AdminUserQuerySchema,
  ChangeAdminPasswordSchema,
  CreateAdminUserSchema,
  UpdateAdminUserSchema,
  UpdateAdminUserStatusSchema,
  type AdminAuthTokenResponse,
  type AdminUserListResponse,
  type AdminUserRecord,
} from './dto';

@ApiTags('admin-users')
@Controller()
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get('admin-users/health')
  @ApiOperation({ summary: 'Admin users module health probe' })
  @ApiOkResponse({ description: 'Admin users module is healthy' })
  health() {
    return this.service.health();
  }

  @Public()
  @Post('auth/admin/login')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Admin portal sign-in (Misba Supervision)' })
  @ApiBody({
    schema: AdminLoginOpenApi,
    examples: {
      default: { summary: 'Admin login', value: AdminLoginExample },
    },
  })
  @ApiOkResponse({
    schema: AdminAuthTokenResponseOpenApi,
    description: 'Admin access and refresh tokens',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Body() body: unknown): Promise<AdminAuthTokenResponse> {
    const dto = AdminLoginSchema.parse(body);
    return this.service.login(dto.email, dto.password);
  }

  @Public()
  @Post('auth/admin/refresh')
  @ApiTags('auth')
  @ApiOperation({ summary: 'Refresh admin portal tokens' })
  @ApiBody({
    schema: AdminRefreshOpenApi,
    examples: {
      default: {
        summary: 'Refresh admin token',
        value: { refreshToken: 'replace-with-refresh-token' },
      },
    },
  })
  @ApiOkResponse({
    schema: AdminAuthTokenResponseOpenApi,
    description: 'Rotated admin tokens',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  refresh(@Body() body: unknown): Promise<AdminAuthTokenResponse> {
    const dto = AdminRefreshSchema.parse(body);
    return this.service.refresh(dto.refreshToken);
  }

  @Post('admin-users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an admin user' })
  @ApiBody({
    schema: CreateAdminUserOpenApi,
    examples: {
      default: { summary: 'Create admin user', value: CreateAdminUserExample },
    },
  })
  @ApiCreatedResponse({
    schema: AdminUserRecordOpenApi,
    description: 'Admin user created',
  })
  @ApiConflictResponse({ description: 'Email already exists' })
  async create(@Body() body: unknown): Promise<AdminUserRecord> {
    const dto = CreateAdminUserSchema.parse(body);
    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }
    return this.service.createAdmin({ ...dto, password: dto.password });
  }

  @Get('admin-users')
  @ApiOperation({ summary: 'List admin users with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INVITED', 'SUSPENDED', 'DELETED'],
  })
  @ApiQuery({
    name: 'roleCode',
    required: false,
    enum: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'FINANCE', 'OPERATIONS'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    schema: AdminUserListResponseOpenApi,
    description: 'Paginated admin user list',
  })
  async list(@Query() query: unknown): Promise<AdminUserListResponse> {
    const parsed = AdminUserQuerySchema.parse(query ?? {});
    return this.service.listAdmins(parsed);
  }

  @Get('admin-users/check-email/:email')
  @ApiOperation({ summary: 'Check if an admin email is available' })
  @ApiParam({ name: 'email', description: 'Admin email address' })
  @ApiOkResponse({ schema: AdminEmailAvailabilityOpenApi })
  async checkEmail(
    @Param('email') email: string,
  ): Promise<{ email: string; available: boolean }> {
    return this.service.checkEmailAvailability(email);
  }

  @Get('admin-users/:id')
  @ApiOperation({ summary: 'Get admin user by ID' })
  @ApiParam({ name: 'id', description: 'Admin user ID' })
  @ApiOkResponse({ schema: AdminUserRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Admin user not found' })
  async get(@Param('id') id: string): Promise<AdminUserRecord> {
    return this.service.getAdminById(id);
  }

  @Put('admin-users/:id')
  @ApiOperation({ summary: 'Full update of an admin user' })
  @ApiParam({ name: 'id', description: 'Admin user ID' })
  @ApiBody({ schema: UpdateAdminUserOpenApi })
  @ApiOkResponse({ schema: AdminUserRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Admin user not found' })
  @ApiConflictResponse({ description: 'Email already taken' })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AdminUserRecord> {
    const dto = UpdateAdminUserSchema.parse(body);
    return this.service.updateAdmin(id, dto);
  }

  @Patch('admin-users/:id')
  @ApiOperation({ summary: 'Partial update of an admin user' })
  @ApiParam({ name: 'id', description: 'Admin user ID' })
  @ApiBody({ schema: UpdateAdminUserOpenApi })
  @ApiOkResponse({ schema: AdminUserRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Admin user not found' })
  async patch(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AdminUserRecord> {
    const dto = UpdateAdminUserSchema.parse(body);
    return this.service.updateAdmin(id, dto);
  }

  @Patch('admin-users/:id/status')
  @ApiOperation({ summary: 'Update admin user status' })
  @ApiParam({ name: 'id', description: 'Admin user ID' })
  @ApiBody({ schema: UpdateAdminUserStatusOpenApi })
  @ApiOkResponse({ schema: AdminUserRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Admin user not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AdminUserRecord> {
    const dto = UpdateAdminUserStatusSchema.parse(body);
    return this.service.updateAdminStatus(id, dto);
  }

  @Patch('admin-users/:id/password')
  @ApiOperation({ summary: 'Change admin user password' })
  @ApiParam({ name: 'id', description: 'Admin user ID' })
  @ApiBody({ schema: ChangeAdminPasswordOpenApi })
  @ApiOkResponse({ schema: AdminUserRecordOpenApi })
  @ApiUnauthorizedResponse({ description: 'Current password incorrect' })
  @ApiNotFoundResponse({ description: 'Admin user not found' })
  async changePassword(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<AdminUserRecord> {
    const dto = ChangeAdminPasswordSchema.parse(body);
    return this.service.changePassword(id, dto);
  }

  @Delete('admin-users/:id')
  @ApiOperation({ summary: 'Delete an admin user' })
  @ApiParam({ name: 'id', description: 'Admin user ID' })
  @ApiOkResponse({ schema: AdminUserDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Admin user not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.deleteAdmin(id);
  }
}
