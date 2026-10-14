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
  CreatePermissionExample,
  CreatePermissionModuleExample,
  CreatePermissionModuleOpenApi,
  CreatePermissionOpenApi,
  PermissionCodeAvailabilityOpenApi,
  PermissionDeleteResponseOpenApi,
  PermissionListResponseOpenApi,
  PermissionMatrixResponseOpenApi,
  PermissionModuleRecordOpenApi,
  PermissionRecordOpenApi,
  UpdatePermissionExample,
  UpdatePermissionModuleOpenApi,
  UpdatePermissionOpenApi,
} from '@mtw/contracts';
import { PermissionsService } from './permissions.service';
import {
  CreatePermissionModuleSchema,
  CreatePermissionSchema,
  PermissionQuerySchema,
  UpdatePermissionModuleSchema,
  UpdatePermissionSchema,
  type PermissionListResponse,
  type PermissionMatrixResponse,
  type PermissionModuleRecord,
  type PermissionRecord,
} from './dto';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Permissions module health probe' })
  @ApiOkResponse({ description: 'Permissions module is healthy' })
  health() {
    return this.service.health();
  }

  @Get('matrix')
  @ApiOperation({
    summary: 'Get permission matrix grouped by module (Access Control UI)',
  })
  @ApiOkResponse({
    schema: PermissionMatrixResponseOpenApi,
    description: 'Modules with nested permissions for the grant matrix',
  })
  async matrix(): Promise<PermissionMatrixResponse> {
    return this.service.getMatrix();
  }

  @Post('modules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a permission module' })
  @ApiBody({
    schema: CreatePermissionModuleOpenApi,
    examples: {
      default: {
        summary: 'Create module',
        value: CreatePermissionModuleExample,
      },
    },
  })
  @ApiCreatedResponse({ schema: PermissionModuleRecordOpenApi })
  @ApiConflictResponse({ description: 'Module code already exists' })
  async createModule(@Body() body: unknown): Promise<PermissionModuleRecord> {
    const dto = CreatePermissionModuleSchema.parse(body);
    return this.service.createModule(dto);
  }

  @Patch('modules/:id')
  @ApiOperation({ summary: 'Update a permission module' })
  @ApiParam({ name: 'id', description: 'Module ID or code' })
  @ApiBody({ schema: UpdatePermissionModuleOpenApi })
  @ApiOkResponse({ schema: PermissionModuleRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Module not found' })
  async updateModule(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<PermissionModuleRecord> {
    const dto = UpdatePermissionModuleSchema.parse(body);
    return this.service.updateModule(id, dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a permission' })
  @ApiBody({
    schema: CreatePermissionOpenApi,
    examples: {
      default: {
        summary: 'Create permission',
        value: CreatePermissionExample,
      },
    },
  })
  @ApiCreatedResponse({ schema: PermissionRecordOpenApi })
  @ApiConflictResponse({ description: 'Permission code already exists' })
  async create(@Body() body: unknown): Promise<PermissionRecord> {
    const dto = CreatePermissionSchema.parse(body);
    return this.service.createPermission(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List permissions with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiQuery({ name: 'moduleId', required: false, type: String })
  @ApiQuery({ name: 'moduleCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: PermissionListResponseOpenApi })
  async list(@Query() query: unknown): Promise<PermissionListResponse> {
    const parsedQuery = PermissionQuerySchema.parse(query ?? {});
    return this.service.listPermissions(parsedQuery);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check if a permission code is available' })
  @ApiParam({ name: 'code', description: 'Permission code (e.g. bookings.view)' })
  @ApiOkResponse({ schema: PermissionCodeAvailabilityOpenApi })
  async checkCodeAvailability(
    @Param('code') code: string,
  ): Promise<{ code: string; available: boolean }> {
    return this.service.checkCodeAvailability(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID or code' })
  @ApiParam({ name: 'id', description: 'Permission ID or code' })
  @ApiOkResponse({ schema: PermissionRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async get(@Param('id') id: string): Promise<PermissionRecord> {
    return this.service.getPermissionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiBody({
    schema: UpdatePermissionOpenApi,
    examples: {
      default: { summary: 'Update permission', value: UpdatePermissionExample },
    },
  })
  @ApiOkResponse({ schema: PermissionRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<PermissionRecord> {
    const dto = UpdatePermissionSchema.parse(body);
    return this.service.updatePermission(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiBody({
    schema: UpdatePermissionOpenApi,
    examples: {
      default: { summary: 'Patch permission', value: UpdatePermissionExample },
    },
  })
  @ApiOkResponse({ schema: PermissionRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async patch(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<PermissionRecord> {
    const dto = UpdatePermissionSchema.parse(body);
    return this.service.updatePermission(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiOkResponse({ schema: PermissionDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.deletePermission(id);
  }
}
