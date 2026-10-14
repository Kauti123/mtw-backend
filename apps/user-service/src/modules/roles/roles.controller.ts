import {
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
} from '@nestjs/swagger';
import {
  CreateRoleExample,
  CreateRoleOpenApi,
  RoleCodeAvailabilityOpenApi,
  RoleDeleteResponseOpenApi,
  RoleListResponseOpenApi,
  RoleRecordOpenApi,
  UpdateRoleExample,
  UpdateRoleOpenApi,
  UpdateRoleStatusExample,
  UpdateRoleStatusOpenApi,
} from '@mtw/contracts';
import { RolesService } from './roles.service';
import {
  CreateRoleSchema,
  RoleQuerySchema,
  UpdateRoleSchema,
  UpdateRoleStatusSchema,
  type RoleListResponse,
  type RoleRecord,
} from './dto';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Roles module health probe' })
  @ApiOkResponse({ description: 'Roles module is healthy' })
  health() {
    return this.service.health();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({
    schema: CreateRoleOpenApi,
    examples: {
      default: { summary: 'Create role (Add Role form)', value: CreateRoleExample },
      uiLabels: {
        summary: 'Create role using UI labels',
        value: {
          roleName: 'Booking Manager',
          roleCode: 'BOOKING_MANAGER',
          description: 'Manages bookings, ticketing operations and related processes.',
          roleType: 'Internal',
          dataScope: 'Global',
          status: 'Active',
          makerCheckerRequired: 'No',
        },
      },
    },
  })
  @ApiCreatedResponse({
    schema: RoleRecordOpenApi,
    description: 'Role created successfully',
  })
  @ApiConflictResponse({ description: 'Role code already exists' })
  async create(@Body() body: unknown): Promise<RoleRecord> {
    const dto = CreateRoleSchema.parse(body);
    return this.service.createRole(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List roles with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiQuery({
    name: 'roleType',
    required: false,
    enum: ['INTERNAL', 'EXTERNAL', 'PARTNER'],
  })
  @ApiQuery({
    name: 'dataScope',
    required: false,
    enum: ['GLOBAL', 'CORPORATE', 'BRANCH', 'SELF'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: RoleListResponseOpenApi, description: 'Paginated role list' })
  async list(@Query() query: unknown): Promise<RoleListResponse> {
    const parsedQuery = RoleQuerySchema.parse(query ?? {});
    return this.service.listRoles(parsedQuery);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check if a role code is available' })
  @ApiParam({ name: 'code', description: 'Role code (e.g. BOOKING_MANAGER)' })
  @ApiOkResponse({ schema: RoleCodeAvailabilityOpenApi })
  async checkCodeAvailability(
    @Param('code') code: string,
  ): Promise<{ code: string; available: boolean }> {
    return this.service.checkCodeAvailability(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID or code' })
  @ApiParam({ name: 'id', description: 'Role ID or code' })
  @ApiOkResponse({ schema: RoleRecordOpenApi, description: 'Role details' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async get(@Param('id') id: string): Promise<RoleRecord> {
    return this.service.getRoleById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({
    schema: UpdateRoleOpenApi,
    examples: { default: { summary: 'Update role', value: UpdateRoleExample } },
  })
  @ApiOkResponse({ schema: RoleRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiConflictResponse({ description: 'Role code already taken' })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<RoleRecord> {
    const dto = UpdateRoleSchema.parse(body);
    return this.service.updateRole(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({
    schema: UpdateRoleOpenApi,
    examples: { default: { summary: 'Patch role', value: UpdateRoleExample } },
  })
  @ApiOkResponse({ schema: RoleRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async patch(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<RoleRecord> {
    const dto = UpdateRoleSchema.parse(body);
    return this.service.updateRole(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update role status' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiBody({
    schema: UpdateRoleStatusOpenApi,
    examples: {
      default: { summary: 'Update status', value: UpdateRoleStatusExample },
    },
  })
  @ApiOkResponse({ schema: RoleRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<RoleRecord> {
    const dto = UpdateRoleStatusSchema.parse(body);
    return this.service.updateRoleStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiOkResponse({
    schema: RoleDeleteResponseOpenApi,
    description: 'Role deleted',
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.deleteRole(id);
  }
}
